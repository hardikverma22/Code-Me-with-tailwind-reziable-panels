import type { Sources } from "../buildSrcDoc";
import { checkPatch } from "./guard";
import { inspectPage } from "./inspect";
import { hasProblem, judge } from "./judge";
import { FixUnavailable, type Attempt, type EngineId, type FixEngine, type PageReport, type Patch, type Problem } from "./types";

export type Progress = {
  engine: EngineId;
  attempt: number;
  of: number;
  stage: "proposing" | "checking";
  /** Why the previous try failed, when this is a retry. */
  lastNote?: string;
};

export type FixResult =
  | { ok: true; engine: EngineId; attempts: number; patch: Patch; summary: string }
  | { ok: false; note: string; attempts: number };

type Options = {
  problem: Problem;
  sources: Sources;
  engines: FixEngine[];
  onProgress?: (p: Progress) => void;
  signal?: AbortSignal;
  /** Tries per engine that can learn from its mistakes. Engines that answer once always get one. */
  maxTries?: number;
  /** Swappable so the loop can be tested without a browser. */
  inspect?: (sources: Sources, signal?: AbortSignal) => Promise<PageReport>;
};

const abortIf = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
};

/**
 * Finds a fix and proves it. Each engine proposes a patch; the patch is run in a hidden sandbox and
 * kept only if the problem is gone and nothing new is wrong. When a try fails, the reason goes back
 * to the engine for the next one.
 */
export async function runFix({ problem, sources, engines, onProgress, signal, maxTries = 3, inspect = (s, sig) => inspectPage(s, 12000, sig) }: Options): Promise<FixResult> {
  const code: Patch = { html: sources.html, css: sources.css, js: sources.js };
  let attempts = 0;

  abortIf(signal);
  const before = await inspect(sources, signal);
  if (!before.completed) return { ok: false, note: "The page did not finish running, so a fix can't be checked.", attempts };
  if (!hasProblem(problem, before)) {
    return {
      ok: false,
      attempts,
      note: problem.type === "error" ? "This error didn't happen when the page was run again, so a fix can't be checked." : "This problem is no longer in the page.",
    };
  }

  let lastNote = "No automatic fix was found.";
  for (const engine of engines) {
    const tries = engine.id === "rules" ? 1 : maxTries;
    let previous: Attempt | null = null;
    for (let attempt = 1; attempt <= tries; attempt++) {
      abortIf(signal);
      onProgress?.({ engine: engine.id, attempt, of: tries, stage: "proposing", lastNote: previous?.note });

      let proposal;
      try {
        proposal = await engine.propose(problem, code, previous, signal, attempt);
      } catch (e) {
        if (e instanceof FixUnavailable) { lastNote = e.message; break; }
        throw e;
      }
      if (!proposal) break;
      attempts++;

      // An answer that could not be turned into a patch at all: tell the engine why and let it try again.
      if ("rejected" in proposal) {
        previous = { patch: code, note: proposal.rejected, detail: proposal.detail };
        lastNote = proposal.rejected;
        continue;
      }

      const guard = checkPatch(code, proposal.patch);
      if (!guard.ok) {
        previous = { patch: proposal.patch, note: guard.note, detail: proposal.detail };
        lastNote = guard.note;
        continue;
      }

      onProgress?.({ engine: engine.id, attempt, of: tries, stage: "checking", lastNote: previous?.note });
      const after = await inspect({ ...sources, ...proposal.patch }, signal);
      const verdict = judge(problem, before, after);
      if (verdict.ok) return { ok: true, engine: engine.id, attempts, patch: proposal.patch, summary: proposal.summary };
      previous = { patch: proposal.patch, note: verdict.note, detail: proposal.detail };
      lastNote = verdict.note;
    }
  }
  return { ok: false, note: lastNote, attempts };
}
