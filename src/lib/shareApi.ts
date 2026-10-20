import type { Sources } from "./buildSrcDoc";
import { getTurnstileToken } from "./turnstile";

// The Convex HTTP endpoint lives on .convex.site, next to the .convex.cloud client URL.
const base = (import.meta.env.VITE_CONVEX_URL as string | undefined)?.replace(".convex.cloud", ".convex.site");

export const canShare = Boolean(base);

export class ShareError extends Error {}

/** Saves a snapshot through the rate-limited endpoint and returns its slug. */
export async function shareProject(sources: Sources, forkedFrom: string | null): Promise<{ slug: string; existing: boolean }> {
  if (!base) throw new ShareError("Sharing isn't available right now.");
  let turnstileToken: string | undefined;
  try {
    turnstileToken = await getTurnstileToken();
  } catch {
    throw new ShareError("Couldn't verify you're human. Disable blockers for this site and try again.");
  }
  let res: Response;
  try {
    res = await fetch(`${base}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...sources, tailwind: Boolean(sources.tailwind), resources: sources.resources ?? [], ...(turnstileToken ? { turnstileToken } : {}), ...(forkedFrom ? { forkedFrom } : {}) }),
    });
  } catch {
    throw new ShareError("Couldn't reach the server. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => ({}))) as { slug?: string; existing?: boolean; error?: string; retryAfterSeconds?: number };
  if (res.ok && data.slug) return { slug: data.slug, existing: Boolean(data.existing) };
  if (data.error === "daily_limit") throw new ShareError("You've reached today's limit of 10 new shares. Sharing the same code again still works.");
  if (res.status === 403) throw new ShareError("Verification failed. Reload the page and try again.");
  if (res.status === 429) {
    const mins = Math.max(1, Math.ceil((data.retryAfterSeconds ?? 60) / 60));
    throw new ShareError(`You're sharing too fast. Try again in ${mins} minute${mins > 1 ? "s" : ""}.`);
  }
  if (res.status === 413) throw new ShareError("This project is too large to share (limit is about 200 KB).");
  throw new ShareError("Couldn't share this project. Try again.");
}
