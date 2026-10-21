import { locateInHtml } from "../a11y";
import { FixUnavailable, type Attempt, type EngineId, type FixEngine, type Patch, type Problem, type Proposal, type Rejection } from "./types";

/**
 * Everything a language-model engine does that does not depend on which model it is: what to show it, how to
 * ask for the answer, how to put the answer back, and when to give up. A backend only has to open a session
 * that can say whether a prompt fits and answer one.
 */

// What the model is asked depends on how much of the page it can be shown. A small page goes in whole and the
// model answers with the corrected tab. A long file goes in as a few numbered lines and the model answers with
// line edits. Asking a small model to rewrite a block of a long file makes it disturb the code around the
// problem, and asking for exact find-and-replace text fails on copying; line numbers need neither.
export const SYSTEM =
  "You repair small web pages. You are given code from a page and one problem found in it. " +
  "Change as little as possible: keep every other line exactly as it is, including spacing and line breaks. " +
  "Keep every element and all existing text. Do not add comments or explanations.";

export const TABS = ["html", "css", "js"] as const;
export type Tab = (typeof TABS)[number];
export type TabAnswer = { tab: Tab; code: string };

export const schemaFor = (tabs: readonly Tab[]) => ({
  type: "object",
  properties: { tab: { type: "string", enum: [...tabs] }, code: { type: "string" } },
  required: ["tab", "code"],
  additionalProperties: false,
});

/**
 * The tabs the model is shown and may change. Sending a whole page makes anything but a toy page too long for
 * the model's context, so each problem gets only the code that can fix it: a runtime error lives in the
 * JavaScript, contrast in the CSS, and the other accessibility problems in the HTML.
 */
export function tabsFor(problem: Problem): Tab[] {
  if (problem.type === "error") return ["js"];
  return problem.finding.rule === "color-contrast" ? ["css"] : ["html"];
}

/** The elements that have an id, for an error in the JavaScript: the one thing it most needs to know about the HTML. */
export function idOutline(html: string, max = 40): string {
  const tags = [...html.matchAll(/<([a-z][a-z0-9-]*)\b[^>]*?\sid\s*=\s*["']([^"']+)["'][^>]*>/gi)].slice(0, max);
  return tags.map((m) => `<${m[1].toLowerCase()} id="${m[2]}">`).join("\n");
}

/** A one-line steer for the error shapes a small model most often gets wrong. */
export function errorHint(message: string): string | null {
  const first = message.split("\n")[0];
  const undef = /(?:ReferenceError:\s*)?([\w$.]+) is not defined/.exec(first);
  if (undef) {
    return (
      `"${undef[1]}" is used but never declared. Add a declaration for it on its own new line, before the first line that uses it, ` +
      `with a sensible starting value (for example: let ${undef[1]} = 0;). Never put a declaration inside another statement or expression. ` +
      "If it is clearly a typo of a name that already exists, correct the typo instead."
    );
  }
  const early = /Cannot access '([\w$]+)' before initialization/.exec(first);
  if (early) {
    return (
      `"${early[1]}" is used on a line above the line that declares it. It is already declared, so do not declare it again. ` +
      "Either delete the line that uses it too early, or move that line to below the declaration."
    );
  }
  if (/Cannot (?:read|set) propert(?:y|ies) of (?:null|undefined)|is null|is undefined/.test(first)) {
    return "Something is null or undefined. Usually a selector or id does not match any element in the HTML. Fix the selector, or add the missing element.";
  }
  if (/SyntaxError|Unexpected (?:token|identifier|end)|Invalid or unexpected|missing \)|Unterminated/.test(first)) {
    return "This is a syntax error. Look for a missing or extra bracket, parenthesis, brace or quote at or just before the reported line.";
  }
  return null;
}

export function describeProblem(problem: Problem): string {
  if (problem.type === "error") {
    const hint = errorHint(problem.message);
    return `Runtime error in the JavaScript: ${problem.message}${hint ? `\nHint: ${hint}` : ""}`;
  }
  const f = problem.finding;
  const parts = [`Accessibility problem (${f.rule}): ${f.message}`, `Element: ${f.snippet}`];
  if (f.fg && f.bg) parts.push(`Text colour rgb(${f.fg.join(", ")}) on background rgb(${f.bg.join(", ")}).`);
  return parts.join("\n");
}

/** A slice of one tab: lines [start, end) of `total`. When it is the whole tab, nothing is left out. */
export type View = { tab: Tab; start: number; end: number; total: number };

const lineCount = (text: string) => text.split("\n").length;

/** The line (0-based) the problem is on, when it can be found: the error's line, the element's line, or the rule that styles it. */
export function centerLine(problem: Problem, code: Patch): number | null {
  if (problem.type === "error") {
    const m = /\(JS line (\d+)\)/.exec(problem.message);
    return m ? Math.min(Number(m[1]), lineCount(code.js)) - 1 : null;
  }
  const f = problem.finding;
  if (f.rule === "color-contrast") {
    const klass = /\bclass\s*=\s*["']([^"']+)["']/.exec(f.snippet)?.[1]?.split(/\s+/)[0];
    const needles = [f.id && `#${f.id}`, klass && `.${klass}`].filter(Boolean) as string[];
    const lines = code.css.split("\n");
    const at = lines.findIndex((l) => needles.some((n) => l.includes(n)));
    return at >= 0 ? at : null;
  }
  const line = locateInHtml(code.html, f);
  return line ? line - 1 : null;
}

/** A line that continues a statement begun above it: indented, or closing a bracket. Blank lines never do. */
const continues = (line: string) => /^\s*\S/.test(line) && (/^\s/.test(line) || /^[})\]]/.test(line));

/**
 * Moves a window's edges outward to whole top-level statements, so it never starts or ends inside a function,
 * object or rule. A model asked to rewrite half a function tends to break it. Gives up (keeps the original
 * edges) if that would grow the window a lot, as it does when the whole file is wrapped in one function.
 */
export function snapToStatements(lines: string[], start: number, end: number): [number, number] {
  let s = start;
  while (s > 0 && continues(lines[s])) s--;
  if (lines[s]?.trim() === "" && s < start) s++;
  let e = end;
  while (e < lines.length && continues(lines[e])) e++;
  return e - s > (end - start) * 3 + 20 ? [start, end] : [s, e];
}

/** A tab this short is always sent whole. */
const SHORT_TAB = 40;
/** Radii, in lines either side of the problem, from a few lines to a lot. */
const RADII = [12, 25, 50, 100];

/**
 * The slices of a tab the model can be shown, smallest first, ending with the whole tab. A small slice is not
 * only a way to fit a small context: the model has to write the slice back, so a small one is much faster and
 * leaves it less to get wrong. Retries move toward bigger slices when the first did not work.
 */
export function candidateViews(problem: Problem, code: Patch): View[] {
  const tab = tabsFor(problem)[0];
  const total = lineCount(code[tab]);
  const whole: View = { tab, start: 0, end: total, total };
  const center = centerLine(problem, code);
  if (center === null || total <= SHORT_TAB) return [whole];
  const views: View[] = [];
  const lines = code[tab].split("\n");
  for (const r of RADII) {
    let start = Math.max(0, center - r);
    let end = Math.min(total, center + r + 1);
    // JavaScript and CSS are made of statements and rules; HTML is one nested tree, where this would swallow the page.
    if (tab !== "html") [start, end] = snapToStatements(lines, start, end);
    const last = views[views.length - 1];
    if (end - start < total && (!last || end - start > last.end - last.start)) views.push({ tab, start, end, total });
  }
  views.push(whole);
  return views;
}

/**
 * Waits for a promise, but gives up with a message the user can act on if it takes too long.
 * `keepWaiting` lets a slow but healthy wait (a model download) run past the limit.
 */
export async function within<T>(promise: Promise<T>, ms: number, message: string, keepWaiting: () => boolean = () => false): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clock = new Promise<never>((_, reject) => {
    const arm = () => { timer = setTimeout(() => (keepWaiting() ? arm() : reject(new FixUnavailable(message))), ms); };
    arm();
  });
  try {
    return await Promise.race([promise, clock]);
  } finally {
    clearTimeout(timer);
  }
}

export const START_TIMEOUT_MS = 60_000;
export const ANSWER_TIMEOUT_MS = 90_000;

/** Puts the model's corrected lines back into the tab, in place of the lines it was shown. */
export function spliceView(code: Patch, view: View, answer: string): string {
  const lines = code[view.tab].split("\n");
  const fresh = answer.replace(/\n+$/, "");
  return [...lines.slice(0, view.start), ...(fresh === "" ? [] : [fresh]), ...lines.slice(view.end)].join("\n");
}

/** A page small enough to show whole: all three tabs together, which small models fix more reliably than one tab alone. */
export const FULL_MAX_CHARS = 2500;

const retryNote = (previous: Attempt | null) =>
  previous
    ? `\n\nA previous fix did not work. Result of checking it: ${previous.note}\nThe previous fix was:\n${previous.detail ?? JSON.stringify(previous.patch)}\nTry a different fix.`
    : "";

const TAB_ANSWER = "Answer with the name of the one tab that needs to change and its complete corrected code.";

export function buildFullPrompt(problem: Problem, code: Patch, previous: Attempt | null): string {
  return `${describeProblem(problem)}\n\nHTML:\n${code.html}\n\nCSS:\n${code.css}\n\nJavaScript:\n${code.js}\n\n${TAB_ANSWER}${retryNote(previous)}`;
}

// ---- line edits, for the part of a long file around the problem ----

export type LineEdit = { line: number; action: "replace" | "delete" | "insert_before"; text: string };

export const LINE_SCHEMA = {
  type: "object",
  properties: {
    edits: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          line: { type: "integer" },
          action: { type: "string", enum: ["replace", "delete", "insert_before"] },
          text: { type: "string" },
        },
        required: ["line", "action", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["edits"],
  additionalProperties: false,
};

/** Numbered lines of a tab, with the instruction for answering in line edits. */
export function buildLinePrompt(problem: Problem, code: Patch, previous: Attempt | null, view: View): string {
  const names = { html: "HTML", css: "CSS", js: "JavaScript" } as const;
  const numbered = code[view.tab]
    .split("\n")
    .slice(view.start, view.end)
    .map((l, i) => `${view.start + i + 1}| ${l}`)
    .join("\n");
  const outline = problem.type === "error" ? idOutline(code.html) : "";
  const ids = outline ? `\n\nElements in the HTML that have an id (the HTML is not shown and cannot change):\n${outline}` : "";
  return (
    `${describeProblem(problem)}\n\n${names[view.tab]}, lines ${view.start + 1} to ${view.end} of ${view.total}. The rest of the file is not shown and stays as it is. ` +
    `Each line starts with its number and a bar, which are not part of the code.\n${numbered}${ids}\n\n` +
    'Answer with the edits that fix the problem, using as few as you can. Each edit gives a line number from the lines shown and an action: ' +
    '"replace" (that line becomes the text), "delete" (remove that line; text is empty), or "insert_before" (add the text as a new line before that line).' +
    retryNote(previous)
  );
}

export function parseLineEdits(raw: string): LineEdit[] | null {
  try {
    const edits = JSON.parse(raw)?.edits;
    if (!Array.isArray(edits) || edits.length === 0 || edits.length > 4) return null;
    for (const e of edits) {
      if (!Number.isInteger(e?.line) || !["replace", "delete", "insert_before"].includes(e?.action) || typeof e?.text !== "string") return null;
    }
    return edits as LineEdit[];
  } catch {
    return null;
  }
}

const indentOf = (line: string) => /^[ \t]*/.exec(line)![0];

/**
 * Applies line edits to the lines the model was shown. Edits are read against the numbers in the prompt, so they
 * are applied from the bottom up and never shift each other. New text takes the indentation of the line it
 * sits at when the model leaves it off.
 */
export function applyLineEdits(code: Patch, view: View, edits: LineEdit[]): { code: string } | { error: string } {
  const lines = code[view.tab].split("\n");
  const seen = new Set<number>();
  for (const e of edits) {
    if (e.line < view.start + 1 || e.line > view.end) return { error: `Line ${e.line} was not one of the lines shown (${view.start + 1} to ${view.end}).` };
    if (seen.has(e.line)) return { error: `Two edits were given for line ${e.line}. Use one edit per line.` };
    seen.add(e.line);
  }
  for (const e of [...edits].sort((a, b) => b.line - a.line)) {
    const at = e.line - 1;
    const indent = indentOf(lines[at] ?? "");
    const indented = (text: string) => (indent === "" || /^[ \t]/.test(text) ? text : indent + text);
    if (e.action === "delete") lines.splice(at, 1);
    else if (e.action === "replace") lines[at] = indented(e.text);
    else lines.splice(at, 0, ...e.text.replace(/\n+$/, "").split("\n").map(indented));
  }
  return { code: lines.join("\n") };
}

export function buildPrompt(problem: Problem, code: Patch, previous: Attempt | null, view?: View): string {
  const retry = retryNote(previous);
  const names = { html: "HTML", css: "CSS", js: "JavaScript" } as const;
  const shown = tabsFor(problem)
    .map((t) => {
      if (view && view.tab === t && (view.start > 0 || view.end < view.total)) {
        const part = code[t].split("\n").slice(view.start, view.end).join("\n");
        return `${names[t]}, lines ${view.start + 1} to ${view.end} of ${view.total}. The rest is not shown and stays as it is. Answer with the corrected version of exactly these lines:\n${part}`;
      }
      return `${names[t]}:\n${code[t]}`;
    })
    .join("\n\n");
  const outline = problem.type === "error" ? idOutline(code.html) : "";
  const ids = outline ? `\n\nElements in the HTML that have an id (the HTML is not shown and cannot change):\n${outline}` : "";
  return `${describeProblem(problem)}\n\n${shown}${ids}${retry}`;
}

/** A model often ends its code with a newline the original did not have, which would show as a stray changed line. */
export const matchTrailingNewline = (before: string, after: string) => (before.endsWith("\n") ? after : after.replace(/\n+$/, ""));

export function parseAnswer(raw: string): TabAnswer | null {
  try {
    const data = JSON.parse(raw);
    return TABS.includes(data?.tab) && typeof data.code === "string" ? { tab: data.tab, code: data.code } : null;
  } catch {
    return null;
  }
}

/** One conversation with a model: it can say whether a prompt leaves room to answer, and it can answer. */
export type ModelSession = {
  fits(prompt: string): Promise<boolean>;
  answer(prompt: string, schema: unknown, signal?: AbortSignal): Promise<string>;
  destroy(): void;
};

/** A loaded model that hands out a fresh session for each attempt. */
export type ModelBackend = {
  open(): Promise<ModelSession>;
  destroy(): void;
};

/** How an engine talks about its model to the user. */
export type ModelWords = { name: string; stuck: string; summary: string };

export class ModelEngine implements FixEngine {
  constructor(readonly id: EngineId, private backend: ModelBackend, private words: ModelWords) {}

  destroy() {
    this.backend.destroy();
  }

  async propose(problem: Problem, code: Patch, previous: Attempt | null, signal?: AbortSignal, attempt = 1): Promise<Proposal | Rejection> {
    const tabs = tabsFor(problem);
    const session = await within(this.backend.open(), START_TIMEOUT_MS, this.words.stuck);
    try {
      // A small page is shown whole. Otherwise: the slice this attempt calls for, stepping down to a smaller
      // one if that does not fit the context. A slice that is the whole tab is answered with the tab; a part of
      // a tab is answered with line edits.
      const views = candidateViews(problem, code);
      let allowed: readonly Tab[] = tabs;
      let view: View | undefined;
      let prompt = buildFullPrompt(problem, code, previous);
      const shownWhole = code.html.length + code.css.length + code.js.length <= FULL_MAX_CHARS && (await session.fits(prompt));
      const isPart = (v: View) => v.start > 0 || v.end < v.total;
      if (shownWhole) {
        allowed = TABS;
      } else {
        for (let i = Math.min(attempt - 1, views.length - 1); i >= 0; i--) {
          prompt = isPart(views[i]) ? buildLinePrompt(problem, code, previous, views[i]) : buildPrompt(problem, code, previous, views[i]);
          if (await session.fits(prompt)) { view = views[i]; break; }
        }
      }
      if (!shownWhole && !view) {
        const name = tabs[0] === "js" ? "JavaScript" : tabs[0].toUpperCase();
        const reason =
          views.length > 1
            ? `Even the lines around this problem are too long for the ${this.words.name}.`
            : centerLine(problem, code) === null
              ? `Your ${name} is too long for the ${this.words.name}, and this problem has no line to focus on.`
              : `Your ${name} is too long for the ${this.words.name}.`;
        throw new FixUnavailable(`${reason} Try fixing it by hand.`);
      }

      const byLines = Boolean(view && isPart(view));
      const raw = await within(
        session.answer(prompt, byLines ? LINE_SCHEMA : schemaFor(allowed), signal),
        ANSWER_TIMEOUT_MS,
        `The ${this.words.name} took too long to answer. ${this.words.stuck.split(". ").pop()}`
      );

      if (byLines) {
        const edits = parseLineEdits(raw);
        if (!edits) return { rejected: "The answer was not a list of line edits.", detail: raw };
        const applied = applyLineEdits(code, view!, edits);
        if ("error" in applied) return { rejected: applied.error, detail: raw };
        const tab = view!.tab;
        return { patch: { ...code, [tab]: matchTrailingNewline(code[tab], applied.code) }, detail: raw, summary: this.words.summary };
      }

      const answer = parseAnswer(raw);
      if (!answer) return { rejected: "The answer was not a tab name and its new code.", detail: raw };
      if (!allowed.includes(answer.tab)) return { rejected: `Only the ${allowed.join(" and ")} code was given, so only that can change.`, detail: raw };
      return {
        patch: { ...code, [answer.tab]: matchTrailingNewline(code[answer.tab], answer.code) },
        detail: JSON.stringify(answer),
        summary: this.words.summary,
      };
    } catch (e) {
      if (e instanceof FixUnavailable || (e instanceof DOMException && e.name === "AbortError")) throw e;
      throw new FixUnavailable(`The ${this.words.name} failed to answer.`);
    } finally {
      session.destroy();
    }
  }
}
