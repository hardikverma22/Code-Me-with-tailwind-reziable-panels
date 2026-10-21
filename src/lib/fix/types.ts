import type { A11yFinding } from "../a11y";
import type { Sources } from "../buildSrcDoc";

/** The three editable tabs. A fix is a replacement for some or all of them. */
export type Patch = Pick<Sources, "html" | "css" | "js">;

/** Something wrong with the page that a fix is meant to remove. */
export type Problem =
  | { type: "a11y"; finding: A11yFinding }
  | { type: "error"; message: string };

/** What the sandbox saw when it ran a page: accessibility findings and runtime errors. */
export type PageReport = {
  findings: A11yFinding[];
  errors: string[];
  /** False when the page never finished its check (it hung or crashed), so its findings cannot be trusted. */
  completed: boolean;
};

export type Proposal = {
  patch: Patch;
  summary: string;
  /** What the engine itself produced (for a model, its raw edits), so a retry can show it what it said. */
  detail?: string;
};

/** An answer that could not even be turned into a patch, with the reason, so the engine can try again. */
export type Rejection = { rejected: string; detail?: string };

/** A fix that did not work, and why. Fed back to the engine on the next try. */
export type Attempt = { patch: Patch; note: string; detail?: string };

export type EngineId = "rules" | "nano";

export interface FixEngine {
  id: EngineId;
  /** Returns null when this engine has nothing to offer for the problem. */
  propose(problem: Problem, code: Patch, previous: Attempt | null, signal?: AbortSignal, attempt?: number): Promise<Proposal | Rejection | null>;
}

/** An engine that cannot continue, with a reason fit to show the user. */
export class FixUnavailable extends Error {}
