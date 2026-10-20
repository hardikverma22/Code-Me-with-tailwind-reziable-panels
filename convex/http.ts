import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { MAX_CHARS } from "./projects";

declare const process: { env: Record<string, string | undefined> };

const http = httpRouter();

const MAX_BODY_BYTES = 400_000;
// Set ALLOWED_ORIGIN in the Convex dashboard (e.g. https://your-site.vercel.app) to lock browsers to your site.
// Note: CORS only governs browsers; the rate limits below are what stop scripts.
const corsHeaders = (_origin: string | null) => {
  const allowed = process.env.ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
};

const json = (status: number, body: unknown, origin: string | null, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...corsHeaders(origin), ...extra } });

http.route({
  path: "/share",
  method: "OPTIONS",
  handler: httpAction(async (_ctx, req) => new Response(null, { status: 204, headers: corsHeaders(req.headers.get("Origin")) })),
});

http.route({
  path: "/share",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const origin = req.headers.get("Origin");
    const declared = Number(req.headers.get("Content-Length") ?? 0);
    if (declared > MAX_BODY_BYTES) return json(413, { error: "too_large" }, origin);

    let body: unknown;
    try {
      const text = await req.text();
      if (text.length > MAX_BODY_BYTES) return json(413, { error: "too_large" }, origin);
      body = JSON.parse(text);
    } catch {
      return json(400, { error: "bad_request" }, origin);
    }

    const b = body as Record<string, unknown> | null;
    const isStr = (x: unknown): x is string => typeof x === "string";
    if (!b || !isStr(b.html) || !isStr(b.css) || !isStr(b.js)) return json(400, { error: "bad_request" }, origin);
    if (b.html.length + b.css.length + b.js.length > MAX_CHARS) return json(413, { error: "too_large" }, origin);
    if (b.tailwind !== undefined && typeof b.tailwind !== "boolean") return json(400, { error: "bad_request" }, origin);
    if (b.forkedFrom !== undefined && !isStr(b.forkedFrom)) return json(400, { error: "bad_request" }, origin);

    const resources = b.resources === undefined ? [] : b.resources;
    const okResources =
      Array.isArray(resources) && resources.length <= 5 &&
      resources.every((r) => r && (r.kind === "script" || r.kind === "style") && isStr(r.url) && r.url.length <= 300 && /^https:\/\/[^\s]+$/.test(r.url));
    if (!okResources) return json(400, { error: "bad_request" }, origin);

    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    // Optional bot challenge: enforced only when TURNSTILE_SECRET is set in the Convex dashboard.
    const secret = process.env.TURNSTILE_SECRET;
    if (secret) {
      const token = isStr(b.turnstileToken) ? b.turnstileToken : "";
      const verify = token
        ? await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: new URLSearchParams({ secret, response: token, ...(ip !== "unknown" ? { remoteip: ip } : {}) }),
          }).then((r) => r.json() as Promise<{ success?: boolean }>).catch(() => ({ success: false }))
        : { success: false };
      if (!verify.success) return json(403, { error: "challenge_failed" }, origin);
    }

    const result = await ctx.runMutation(internal.projects.createLimited, {
      ip,
      html: b.html, css: b.css, js: b.js,
      ...(b.tailwind !== undefined ? { tailwind: b.tailwind } : {}),
      ...(resources.length ? { resources: resources as { kind: "script" | "style"; url: string }[] } : {}),
      ...(b.forkedFrom !== undefined ? { forkedFrom: b.forkedFrom } : {}),
    });

    if (result.ok) return json(200, { slug: result.slug, existing: result.existing }, origin);
    const status = result.reason === "too_large" ? 413 : result.reason === "bad_request" ? 400 : 429;
    return json(status, { error: result.reason, retryAfterSeconds: result.retryAfterSeconds }, origin, result.retryAfterSeconds ? { "Retry-After": String(result.retryAfterSeconds) } : {});
  }),
});

export default http;
