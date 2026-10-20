import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { rateLimiter } from "./limits";

export const MAX_CHARS = 200_000;
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";
const SLUG_RE = /^[a-z0-9]{4,32}$/;

function randomSlug(length = 8) {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

/**
 * Not callable from clients. Only the /share HTTP endpoint reaches it, after validation.
 * Rate limits run in the same transaction as the insert, so a failed insert never burns quota.
 */
export const createLimited = internalMutation({
  args: {
    ip: v.string(),
    html: v.string(),
    css: v.string(),
    js: v.string(),
    tailwind: v.optional(v.boolean()),
    forkedFrom: v.optional(v.string()),
  },
  returns: v.union(
    v.object({ ok: v.literal(true), slug: v.string() }),
    v.object({ ok: v.literal(false), reason: v.string(), retryAfterSeconds: v.number() })
  ),
  handler: async (ctx, { ip, forkedFrom, ...project }) => {
    if (project.html.length + project.css.length + project.js.length > MAX_CHARS) {
      return { ok: false as const, reason: "too_large", retryAfterSeconds: 0 };
    }
    if (forkedFrom !== undefined && !SLUG_RE.test(forkedFrom)) {
      return { ok: false as const, reason: "bad_request", retryAfterSeconds: 0 };
    }

    const perIp = await rateLimiter.limit(ctx, "sharePerIp", { key: ip });
    if (!perIp.ok) {
      return { ok: false as const, reason: "rate_limited", retryAfterSeconds: Math.ceil(perIp.retryAfter / 1000) };
    }
    const global = await rateLimiter.limit(ctx, "shareGlobal");
    if (!global.ok) {
      return { ok: false as const, reason: "busy", retryAfterSeconds: Math.ceil(global.retryAfter / 1000) };
    }

    let slug = randomSlug();
    while (await ctx.db.query("projects").withIndex("by_slug", (q) => q.eq("slug", slug)).unique()) {
      slug = randomSlug();
    }
    await ctx.db.insert("projects", { slug, ...project, ...(forkedFrom ? { forkedFrom } : {}) });
    return { ok: true as const, slug };
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  returns: v.union(
    v.null(),
    v.object({ slug: v.string(), html: v.string(), css: v.string(), js: v.string(), tailwind: v.boolean(), forkedFrom: v.union(v.string(), v.null()) })
  ),
  handler: async (ctx, { slug }) => {
    if (!SLUG_RE.test(slug)) return null;
    const p = await ctx.db.query("projects").withIndex("by_slug", (q) => q.eq("slug", slug)).unique();
    return p && { slug: p.slug, html: p.html, css: p.css, js: p.js, tailwind: p.tailwind ?? false, forkedFrom: p.forkedFrom ?? null };
  },
});
