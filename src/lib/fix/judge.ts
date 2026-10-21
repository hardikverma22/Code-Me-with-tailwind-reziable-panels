import type { A11yFinding } from "../a11y";
import type { PageReport, Problem } from "./types";

const countByRule = (findings: A11yFinding[]) => findings.reduce<Record<string, number>>((m, f) => ((m[f.rule] = (m[f.rule] ?? 0) + 1), m), {});

/** The first line of an error, without the "(JS line N)" the preview appends, so the same error compares equal. */
export const normalizeError = (message: string) => message.split("\n")[0].replace(/\s*\(JS line \d+\)\s*$/, "").trim();

/** Whether the problem is in this report: the same finding rule is present, or the same error was thrown. */
export function hasProblem(problem: Problem, report: PageReport): boolean {
  if (problem.type === "a11y") return report.findings.some((f) => f.rule === problem.finding.rule);
  const target = normalizeError(problem.message);
  return report.errors.some((e) => normalizeError(e) === target);
}

/**
 * Compares the page before and after a fix. It passes only when the problem is gone and nothing
 * new is wrong: no error that was not already there and, for an accessibility fix, no extra findings.
 */
export function judge(problem: Problem, before: PageReport, after: PageReport): { ok: true } | { ok: false; note: string } {
  if (!after.completed) return { ok: false, note: "The page stopped responding after the fix." };
  const b = countByRule(before.findings);
  const a = countByRule(after.findings);

  if (problem.type === "a11y") {
    const rule = problem.finding.rule;
    if ((a[rule] ?? 0) >= (b[rule] ?? 0)) return { ok: false, note: `Still ${a[rule] ?? 0} ${rule} problem${(a[rule] ?? 0) === 1 ? "" : "s"} after the fix.` };
  } else {
    const target = normalizeError(problem.message);
    if (after.errors.some((e) => normalizeError(e) === target)) return { ok: false, note: `The same error is still thrown: ${target}` };
  }

  const known = new Set(before.errors.map(normalizeError));
  const fresh = after.errors.map(normalizeError).find((e) => !known.has(e));
  if (fresh) return { ok: false, note: `The fix caused a new error: ${fresh}` };

  // A script that stopped on an error never drew its page, so fixing it can reveal accessibility findings that were
  // always there. Those are not caused by the fix, so only an accessibility fix is held to them.
  if (problem.type === "a11y") {
    const worse = Object.keys(a).find((r) => (a[r] ?? 0) > (b[r] ?? 0));
    if (worse) return { ok: false, note: `The fix caused a new ${worse} problem.` };
  }
  return { ok: true };
}
