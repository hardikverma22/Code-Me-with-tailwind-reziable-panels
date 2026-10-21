import { diffStats, lineDiff } from "../diff";
import type { Patch } from "./types";

const TABS = ["html", "css", "js"] as const;

/** Lines with surrounding and repeated spaces removed, and empty lines dropped. */
const squash = (text: string) => text.split("\n").map((l) => l.trim().replace(/\s+/g, " ")).filter(Boolean);

const tagCount = (html: string) => (html.match(/<[a-z][a-z0-9-]*/gi) ?? []).length;

const words = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];

/**
 * A fix that passes the checks can still be a bad fix: deleting the broken element also clears its
 * finding. This turns down patches that change nothing, remove elements or text, or rewrite a large part of a tab.
 */
export function checkPatch(before: Patch, after: Patch): { ok: true } | { ok: false; note: string } {
  if (TABS.every((t) => before[t] === after[t])) return { ok: false, note: "The fix changed nothing." };

  if (tagCount(after.html) < tagCount(before.html)) return { ok: false, note: "The fix removed elements from the HTML. Keep every element." };

  const pool = new Map<string, number>();
  for (const w of words(after.html)) pool.set(w, (pool.get(w) ?? 0) + 1);
  let lost = 0;
  for (const w of words(before.html)) {
    const n = pool.get(w) ?? 0;
    if (n > 0) pool.set(w, n - 1);
    else lost++;
  }
  if (lost > 2) return { ok: false, note: "The fix removed text from the page. Keep all existing text." };

  for (const t of TABS) {
    // Indentation and blank lines are not changes a person made, so a model that re-spaces its answer is not penalised.
    const b = squash(before[t]);
    const { removed } = diffStats(lineDiff(b.join("\n"), squash(after[t]).join("\n")));
    const lines = b.length;
    if (removed > Math.max(4, Math.ceil(lines * 0.4))) return { ok: false, note: `The fix rewrote too much of the ${t.toUpperCase()}. Change as little as possible.` };
  }
  return { ok: true };
}
