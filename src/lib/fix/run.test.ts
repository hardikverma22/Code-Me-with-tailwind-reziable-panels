import { vi } from "vitest";
import type { A11yFinding } from "../a11y";
import type { Sources } from "../buildSrcDoc";
import { checkPatch } from "./guard";
import { hasProblem, judge, normalizeError } from "./judge";
import { applyLineEdits, buildFullPrompt, buildLinePrompt, buildPrompt, parseLineEdits, candidateViews, snapToStatements, centerLine, describeProblem, errorHint, idOutline, matchTrailingNewline, NanoEngine, nanoState, parseAnswer, spliceView, tabsFor, within } from "./nano";
import { runFix } from "./run";
import { FixUnavailable, type Attempt, type FixEngine, type PageReport, type Patch, type Problem } from "./types";

const finding = (rule: A11yFinding["rule"], extra: Partial<A11yFinding> = {}): A11yFinding => ({
  rule, severity: "error", message: `${rule} problem`, snippet: "<x>", tag: "x", id: null, tagIndex: 0, tagCount: 1, ...extra,
});
const report = (rules: A11yFinding["rule"][] = [], errors: string[] = [], completed = true): PageReport => ({ findings: rules.map((r) => finding(r)), errors, completed });
const code = (html: string, css = "", js = ""): Patch => ({ html, css, js });

describe("checkPatch", () => {
  const before = code('<h1>Shop</h1>\n<img src="a.png">\n<p>Three new arrivals this week</p>', "a { color: red }", "run();");

  it("accepts a small additive change", () => {
    expect(checkPatch(before, { ...before, html: before.html.replace("<img", '<img alt=""') })).toEqual({ ok: true });
  });
  it("turns down no change", () => {
    expect(checkPatch(before, { ...before })).toMatchObject({ ok: false, note: expect.stringMatching(/nothing/) });
  });
  it("turns down a fix that deletes the element", () => {
    const after = { ...before, html: '<h1>Shop</h1>\n<p>Three new arrivals this week</p>' };
    expect(checkPatch(before, after)).toMatchObject({ ok: false, note: expect.stringMatching(/removed elements/) });
  });
  it("turns down a fix that deletes text but keeps the tags", () => {
    const after = { ...before, html: '<h1>Shop</h1>\n<img src="a.png" alt="">\n<p>Hi</p>' };
    expect(checkPatch(before, after)).toMatchObject({ ok: false, note: expect.stringMatching(/removed text/) });
  });
  it("allows a heading level change, which swaps one tag for another", () => {
    expect(checkPatch(code("<h1>a</h1><h3>b</h3>"), code("<h1>a</h1><h2>b</h2>"))).toEqual({ ok: true });
  });
  it("turns down a rewrite of most of a tab", () => {
    const js = Array.from({ length: 20 }, (_, i) => `step${i}();`).join("\n");
    const after = { ...code("<p>x</p>", "", js), js: "other();" };
    expect(checkPatch(code("<p>x</p>", "", js), after)).toMatchObject({ ok: false, note: expect.stringMatching(/JS/) });
  });
});

describe("judge", () => {
  const img: Problem = { type: "a11y", finding: finding("img-alt") };

  it("passes when the finding is gone and nothing is new", () => {
    expect(judge(img, report(["img-alt"]), report([]))).toEqual({ ok: true });
    expect(judge(img, report(["img-alt", "img-alt"]), report(["img-alt"]))).toEqual({ ok: true });
  });
  it("fails when the finding is still there", () => {
    expect(judge(img, report(["img-alt"]), report(["img-alt"]))).toMatchObject({ ok: false, note: expect.stringMatching(/Still 1 img-alt/) });
  });
  it("fails when the fix causes a new finding of another rule", () => {
    expect(judge(img, report(["img-alt"]), report(["form-label"]))).toMatchObject({ ok: false, note: expect.stringMatching(/new form-label/) });
  });
  it("fails when the fix causes a new error, but not for an error that was already there", () => {
    expect(judge(img, report(["img-alt"], ["Boom"]), report([], ["Boom"]))).toEqual({ ok: true });
    expect(judge(img, report(["img-alt"]), report([], ["Boom"]))).toMatchObject({ ok: false, note: expect.stringMatching(/new error: Boom/) });
  });
  it("does not blame a script fix for accessibility findings that rendering the page revealed", () => {
    const err: Problem = { type: "error", message: "Uncaught ReferenceError: dd is not defined (JS line 1)" };
    // before: the script died on line 1 and the page was never drawn, so nothing could be found in it
    expect(judge(err, report([], ["Uncaught ReferenceError: dd is not defined (JS line 1)"]), report(["color-contrast", "color-contrast"]))).toEqual({ ok: true });
    // but a new error is still a failure
    expect(judge(err, report([], ["Uncaught ReferenceError: dd is not defined"]), report([], ["Uncaught TypeError: x"]))).toMatchObject({ ok: false });
    // and an accessibility fix is still held to the findings it causes
    expect(judge(img, report(["img-alt"]), report(["color-contrast"]))).toMatchObject({ ok: false, note: expect.stringMatching(/new color-contrast/) });
  });
  it("never passes a page that stopped responding", () => {
    expect(judge(img, report(["img-alt"]), report([], [], false))).toMatchObject({ ok: false, note: expect.stringMatching(/stopped responding/) });
  });
  it("judges a runtime error by its message, ignoring the line suffix", () => {
    const err: Problem = { type: "error", message: "Uncaught ReferenceError: count is not defined (JS line 2)" };
    const before = report([], ["Uncaught ReferenceError: count is not defined (JS line 2)"]);
    expect(hasProblem(err, before)).toBe(true);
    expect(judge(err, before, report([], ["Uncaught ReferenceError: count is not defined (JS line 7)"]))).toMatchObject({ ok: false });
    expect(judge(err, before, report([], []))).toEqual({ ok: true });
    expect(judge(err, before, report([], ["Uncaught TypeError: x is null"]))).toMatchObject({ ok: false, note: expect.stringMatching(/new error/) });
  });
  it("normalises errors to their first line", () => {
    expect(normalizeError("Error: a (JS line 3)\n    at x")).toBe("Error: a");
  });
});

describe("runFix", () => {
  const sources: Sources = { html: "<p>x</p>", css: "", js: "", tailwind: false, resources: [] };
  const img: Problem = { type: "a11y", finding: finding("img-alt") };
  /** An inspector that reports the problem until the patch contains "FIXED". */
  const inspect = vi.fn(async (s: Sources) => (s.html.includes("FIXED") ? report([]) : report(["img-alt"])));
  const engine = (id: FixEngine["id"], answers: (Patch | null)[], seen: (Attempt | null)[] = []): FixEngine => {
    let i = 0;
    return {
      id,
      async propose(_p, _c, previous) {
        seen.push(previous);
        const patch = answers[i++];
        return patch ? { patch, summary: `${id} try ${i}` } : null;
      },
    };
  };

  // Braces matter: a returned function is run by the runner as cleanup, and the mock would be called with nothing.
  beforeEach(() => { inspect.mockClear(); });

  it("returns the first verified fix and stops there", async () => {
    const rules = engine("rules", [code("<p>FIXED x</p>")]);
    const nano = engine("nano", [code("<p>FIXED never</p>")]);
    const r = await runFix({ problem: img, sources, engines: [rules, nano], inspect });
    expect(r).toMatchObject({ ok: true, engine: "rules", attempts: 1 });
    expect(inspect).toHaveBeenCalledTimes(2); // once before, once to check the fix
  });

  it("falls through to the next engine when the first has nothing", async () => {
    const r = await runFix({ problem: img, sources, engines: [engine("rules", [null]), engine("nano", [code("<p>FIXED x</p>")])], inspect });
    expect(r).toMatchObject({ ok: true, engine: "nano" });
  });

  it("feeds the reason a try failed back into the next try", async () => {
    const seen: (Attempt | null)[] = [];
    const nano = engine("nano", [code("<p>still x</p>"), code("<p>FIXED x</p>")], seen);
    const r = await runFix({ problem: img, sources, engines: [nano], inspect });
    expect(r).toMatchObject({ ok: true, attempts: 2 });
    expect(seen[0]).toBeNull();
    expect(seen[1]?.note).toMatch(/Still 1 img-alt/);
    expect(seen[1]?.patch.html).toBe("<p>still x</p>");
  });

  it("does not run the sandbox for a patch the guard turns down, and says why on the retry", async () => {
    const seen: (Attempt | null)[] = [];
    const nano = engine("nano", [code("<p>FIXED</p>"), code("<p>FIXED x</p>")], seen);
    const big: Sources = { ...sources, html: "<p>Alpha beta gamma delta</p>" };
    const r = await runFix({ problem: img, sources: big, engines: [nano], inspect });
    expect(r.ok).toBe(false); // neither answer keeps the text
    expect(seen[1]?.note).toMatch(/removed text/);
    expect(inspect).toHaveBeenCalledTimes(1); // only the baseline
  });

  it("gives up after the allowed tries and reports the last reason", async () => {
    const nano = engine("nano", [code("<p>a x</p>"), code("<p>b x</p>"), code("<p>c x</p>"), code("<p>FIXED x</p>")]);
    const r = await runFix({ problem: img, sources, engines: [nano], inspect });
    expect(r).toMatchObject({ ok: false, attempts: 3, note: expect.stringMatching(/Still 1 img-alt/) });
  });

  it("stops an engine that says it cannot go on, with its reason", async () => {
    const bad: FixEngine = { id: "nano", propose: async () => { throw new FixUnavailable("Your code is too long."); } };
    expect(await runFix({ problem: img, sources, engines: [bad], inspect })).toMatchObject({ ok: false, note: "Your code is too long." });
  });

  it("will not fix a problem that is not in the page, or a page that never finishes", async () => {
    const gone = vi.fn(async () => report([]));
    expect(await runFix({ problem: img, sources, engines: [engine("rules", [code("x")])], inspect: gone })).toMatchObject({ ok: false, note: expect.stringMatching(/no longer in the page/) });
    const hung = vi.fn(async () => report(["img-alt"], [], false));
    expect(await runFix({ problem: img, sources, engines: [engine("rules", [code("x")])], inspect: hung })).toMatchObject({ ok: false, note: expect.stringMatching(/did not finish/) });
  });

  it("does not pass a fix that breaks the page", async () => {
    const breaking = vi.fn(async (s: Sources) => (s.html.includes("FIXED") ? report([], [], false) : report(["img-alt"])));
    const r = await runFix({ problem: img, sources, engines: [engine("rules", [code("<p>FIXED x</p>")])], inspect: breaking });
    expect(r).toMatchObject({ ok: false, note: expect.stringMatching(/stopped responding/) });
  });

  it("reports progress and stops when aborted", async () => {
    const steps: string[] = [];
    await runFix({ problem: img, sources, engines: [engine("rules", [code("<p>FIXED x</p>")])], inspect, onProgress: (p) => steps.push(`${p.engine}:${p.stage}`) });
    expect(steps).toEqual(["rules:proposing", "rules:checking"]);
    const ctl = new AbortController();
    ctl.abort();
    await expect(runFix({ problem: img, sources, engines: [], inspect, signal: ctl.signal })).rejects.toMatchObject({ name: "AbortError" });
  });
});

describe("rejected answers", () => {
  const sources: Sources = { html: "<p>x</p>", css: "", js: "", tailwind: false, resources: [] };
  const img: Problem = { type: "a11y", finding: finding("img-alt") };
  const inspect = vi.fn(async (s: Sources) => (s.html.includes("FIXED") ? report([]) : report(["img-alt"])));

  it("tells the engine why its answer was rejected and lets it try again", async () => {
    const seen: (Attempt | null)[] = [];
    let n = 0;
    const engine: FixEngine = {
      id: "nano",
      async propose(_p, _c, previous) {
        seen.push(previous);
        return n++ === 0 ? { rejected: "Edit 1: the text to find was not in the HTML.", detail: '{"edits":[]}' } : { patch: code("<p>FIXED x</p>"), summary: "ok" };
      },
    };
    const r = await runFix({ problem: img, sources, engines: [engine], inspect });
    expect(r).toMatchObject({ ok: true, attempts: 2 });
    expect(seen[1]).toMatchObject({ note: expect.stringMatching(/not in the HTML/), detail: '{"edits":[]}' });
    expect(inspect).toHaveBeenCalledTimes(2); // the rejected answer never reached the sandbox
  });
});

describe("Nano engine", () => {
  const problem: Problem = { type: "a11y", finding: finding("color-contrast", { snippet: '<p class="note">', fg: [170, 170, 170], bg: [255, 255, 255] }) };
  const page = code('<p class="note">Sale</p>', ".note{color:#aaa}", "");
  const answerOf = (tab: string, code: string) => JSON.stringify({ tab, code });

  afterEach(() => { delete (globalThis as { LanguageModel?: unknown }).LanguageModel; });

  const install = (answer: string | (() => string), opts: { usage?: number; quota?: number; availability?: string } = {}) => {
    const calls: string[] = [];
    const session = {
      prompt: vi.fn(async (input: string) => { calls.push(input); return typeof answer === "function" ? answer() : answer; }),
      clone: async () => session,
      destroy: vi.fn(),
      measureInputUsage: async () => opts.usage ?? 100,
      inputQuota: opts.quota ?? 4000,
    };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = {
      availability: vi.fn(async () => opts.availability ?? "available"),
      create: vi.fn(async () => session),
    };
    return { session, calls };
  };

  it("reports whether the model is usable", async () => {
    expect(await nanoState()).toBe("missing");
    install("{}", { availability: "available" });
    expect(await nanoState()).toBe("ready");
    install("{}", { availability: "downloadable" });
    expect(await nanoState()).toBe("downloadable");
    install("{}", { availability: "unavailable" });
    expect(await nanoState()).toBe("unavailable");
  });

  it("asks for one tab as JSON, replaces just that tab, and keeps what it said for a retry", async () => {
    const answer = answerOf("css", ".note{color:#595959}");
    const { session, calls } = install(answer);
    const engine = await NanoEngine.create();
    const p = (await engine.propose(problem, page, null)) as { patch: Patch; detail: string };
    expect(p.patch).toEqual({ html: page.html, css: ".note{color:#595959}", js: "" });
    expect(p.detail).toBe(answer);
    expect(session.prompt).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ responseConstraint: expect.objectContaining({ required: ["tab", "code"] }) }));
    expect(calls[0]).toContain("color-contrast problem");
    expect(calls[0]).toContain("rgb(170, 170, 170) on background rgb(255, 255, 255)");
    expect(session.destroy).toHaveBeenCalled();
  });

  it("puts the previous answer and why it failed into the next prompt", () => {
    const prompt = buildPrompt(problem, page, { patch: code("<p>y</p>"), note: "Still 1 color-contrast problem after the fix.", detail: '{"tab":"css","code":"x"}' });
    expect(prompt).toContain("A previous fix did not work");
    expect(prompt).toContain("Still 1 color-contrast problem");
    expect(prompt).toContain('{"tab":"css","code":"x"}');
  });

  it("rejects, with a reason, an answer that is not a tab and its code", async () => {
    install("not json");
    expect(await (await NanoEngine.create()).propose(problem, page, null)).toMatchObject({ rejected: expect.stringMatching(/not a tab name/), detail: "not json" });
    install(JSON.stringify({ tab: "php", code: "x" }));
    expect(await (await NanoEngine.create()).propose(problem, page, null)).toMatchObject({ rejected: expect.any(String) });
  });

  it("refuses code that is too long for the model's context, without asking it", async () => {
    const { session } = install("{}", { usage: 3500, quota: 4000 });
    const engine = await NanoEngine.create();
    await expect(engine.propose(problem, page, null)).rejects.toThrow(FixUnavailable);
    expect(session.prompt).not.toHaveBeenCalled();
  });

  it("turns a model failure into a reason the user can read", async () => {
    install(() => { throw new Error("boom"); });
    await expect((await NanoEngine.create()).propose(problem, page, null)).rejects.toThrow(/failed to answer/);
  });

  it("explains when there is no model", async () => {
    await expect(NanoEngine.create()).rejects.toThrow(/no built-in AI/);
  });
});

describe("parseAnswer", () => {
  it("accepts only a known tab with code", () => {
    expect(parseAnswer('{"tab":"js","code":"a();"}')).toEqual({ tab: "js", code: "a();" });
    expect(parseAnswer('{"tab":"css","code":""}')).toEqual({ tab: "css", code: "" });
    for (const bad of ['{"tab":"php","code":"x"}', '{"tab":"js"}', '{"tab":"js","code":1}', "{}", "nope"]) {
      expect(parseAnswer(bad)).toBeNull();
    }
  });
});

describe("error hints", () => {
  it("steers the common runtime errors, and says nothing for others", () => {
    expect(errorHint("Uncaught ReferenceError: count is not defined (JS line 2)")).toMatch(/"count" is used but never declared.*own new line/);
    expect(errorHint("Uncaught TypeError: Cannot set properties of null (setting 'textContent')")).toMatch(/selector or id/);
    expect(errorHint("Uncaught ReferenceError: Cannot access 'reduced' before initialization (JS line 1)")).toMatch(/"reduced" is used on a line above.*do not declare it again/);
    expect(errorHint("Uncaught SyntaxError: Unexpected token '{'")).toMatch(/syntax error/);
    expect(errorHint("Uncaught RangeError: Maximum call stack size exceeded")).toBeNull();
  });
  it("puts the hint in the prompt for an error problem", () => {
    const p = describeProblem({ type: "error", message: "Uncaught ReferenceError: count is not defined" });
    expect(p).toContain("Hint:");
    expect(describeProblem({ type: "error", message: "Uncaught RangeError: x" })).not.toContain("Hint:");
  });
});

describe("checkPatch ignores re-spacing", () => {
  it("does not count indentation or blank-line changes as a rewrite", () => {
    const html = Array.from({ length: 10 }, (_, i) => `    <p>line ${i}</p>`).join("\n");
    const respaced = html.split("\n").map((l) => l.trim()).join("\n\n");
    const before = code(html + "\n<img src=a>");
    expect(checkPatch(before, code(respaced + '\n<img src=a alt="">'))).toEqual({ ok: true });
  });
});

describe("matchTrailingNewline", () => {
  it("drops a trailing newline the original did not have, and keeps one it did", () => {
    expect(matchTrailingNewline("a();", "let b;\na();\n")).toBe("let b;\na();");
    expect(matchTrailingNewline("a();\n", "let b;\na();\n")).toBe("let b;\na();\n");
    expect(matchTrailingNewline("", "x\n\n")).toBe("x");
  });
  it("is applied to the engine's answer", async () => {
    const session = { prompt: async () => JSON.stringify({ tab: "js", code: "let c = 0;\nrun();\n" }), clone: async () => session, destroy() {}, measureInputUsage: async () => 10, inputQuota: 4000 };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    const engine = await NanoEngine.create();
    const p = (await engine.propose({ type: "error", message: "ReferenceError: c is not defined" }, { html: "", css: "", js: "run();" }, null)) as { patch: Patch };
    expect(p.patch.js).toBe("let c = 0;\nrun();");
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
  });
});

describe("what the model is shown", () => {
  const html = '<main id="app">\n<p class="msg"></p>\n<canvas id="chart"></canvas>\n</main>';
  const big = { html, css: ".x { color: red }".repeat(900), js: "const a = 1;\nconsole.log(reduced);\nconst reduced = 2;" };
  const err: Problem = { type: "error", message: "Uncaught ReferenceError: Cannot access 'reduced' before initialization (JS line 2)" };

  it("picks the tab each kind of problem can be fixed in", () => {
    expect(tabsFor(err)).toEqual(["js"]);
    expect(tabsFor({ type: "a11y", finding: finding("color-contrast") })).toEqual(["css"]);
    for (const rule of ["form-label", "button-name", "img-alt", "heading-order", "link-name"] as const) {
      expect(tabsFor({ type: "a11y", finding: finding(rule) })).toEqual(["html"]);
    }
  });

  it("shows a runtime error only the JavaScript, plus which ids the HTML has", () => {
    const prompt = buildPrompt(err, big, null);
    expect(prompt).toContain("console.log(reduced);");
    expect(prompt).toContain('<canvas id="chart">');
    expect(prompt).toContain('<main id="app">');
    expect(prompt).not.toContain("color: red");
    expect(prompt).not.toContain('<p class="msg">');
  });

  it("shows an accessibility problem only the tab it lives in", () => {
    const prompt = buildPrompt({ type: "a11y", finding: finding("color-contrast") }, big, null);
    expect(prompt).toContain("color: red");
    expect(prompt).not.toContain("console.log(reduced)");
    expect(prompt).not.toContain("<canvas");
  });

  it("lists elements with ids, and stops at a limit", () => {
    expect(idOutline(html)).toBe('<main id="app">\n<canvas id="chart">');
    expect(idOutline(Array.from({ length: 100 }, (_, i) => `<p id="p${i}">`).join(""), 5).split("\n")).toHaveLength(5);
  });

  it("fits a page that the whole-page prompt would not", async () => {
    const calls: string[] = [];
    // A model that counts one token per three characters and has room for 4000.
    const session = {
      prompt: async (input: string) => { calls.push(input); return JSON.stringify({ tab: "js", code: "const reduced = 2;\nconsole.log(reduced);" }); },
      clone: async () => session, destroy() {},
      measureInputUsage: async (input: string) => Math.ceil(input.length / 3),
      inputQuota: 4000,
    };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    const engine = await NanoEngine.create();
    const whole = `${describeProblem(err)}\n\nHTML:\n${big.html}\n\nCSS:\n${big.css}\n\nJavaScript:\n${big.js}`;
    expect(Math.ceil(whole.length / 3)).toBeGreaterThan(3000); // the old prompt would have been turned away
    const p = await engine.propose(err, big, null);
    expect(p).toMatchObject({ patch: { js: "const reduced = 2;\nconsole.log(reduced);", css: big.css, html: big.html } });
    expect(calls).toHaveLength(1);
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
  });

  it("rejects an answer that changes a tab it was not given", async () => {
    const session = { prompt: async () => JSON.stringify({ tab: "html", code: "<p></p>" }), clone: async () => session, destroy() {}, measureInputUsage: async () => 10, inputQuota: 4000 };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    const engine = await NanoEngine.create();
    expect(await engine.propose(err, big, null)).toMatchObject({ rejected: expect.stringMatching(/Only the js code was given/) });
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
  });

  it("names the tab that is too long when even that does not fit", async () => {
    const session = { prompt: async () => "{}", clone: async () => session, destroy() {}, measureInputUsage: async () => 9000, inputQuota: 4000 };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    const engine = await NanoEngine.create();
    await expect(engine.propose(err, big, null)).rejects.toThrow(/Your JavaScript is too long/);
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
  });
});

describe("long files: only the lines around the problem", () => {
  // a 600-line script with the error on line 300
  const lines = Array.from({ length: 600 }, (_, i) => `const value${i} = compute(${i}); // step ${i}`);
  lines[299] = "console.log(reduced);";
  const js = lines.join("\n");
  const code = { html: '<main id="app"></main>', css: "", js };
  const err: Problem = { type: "error", message: "Uncaught ReferenceError: Cannot access 'reduced' before initialization (JS line 300)" };

  const install = (reply: (prompt: string) => string) => {
    const calls: string[] = [];
    const session = {
      prompt: async (input: string) => { calls.push(input); return reply(input); },
      clone: async () => session, destroy() {},
      measureInputUsage: async (input: string) => Math.ceil(input.length / 3), // one token per three characters
      inputQuota: 4000,
    };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    return calls;
  };
  afterEach(() => { delete (globalThis as { LanguageModel?: unknown }).LanguageModel; });

  it("finds the line each kind of problem is on", () => {
    expect(centerLine(err, code)).toBe(299);
    expect(centerLine({ type: "error", message: "Uncaught Error: no line here" }, code)).toBeNull();
    const html = "<h1>a</h1>\n<p>b</p>\n<img src=x>";
    const img = { type: "a11y" as const, finding: finding("img-alt", { tag: "img", tagIndex: 0, tagCount: 1 }) };
    expect(centerLine(img, { html, css: "", js: "" })).toBe(2);
    const contrast = { type: "a11y" as const, finding: finding("color-contrast", { snippet: '<p class="note faint">' }) };
    expect(centerLine(contrast, { html: "", css: "a { x: 1 }\n.note {\n  color: #aaa;\n}", js: "" })).toBe(1);
  });

  it("offers small windows around the problem first, growing to the whole tab", () => {
    const views = candidateViews(err, code);
    expect(views[0]).toMatchObject({ tab: "js", start: 287, end: 312 }); // 12 lines either side of line 300
    expect(views[1]).toMatchObject({ start: 274, end: 325 });
    expect(views[views.length - 1]).toMatchObject({ start: 0, end: 600 });
    const sizes = views.map((v) => v.end - v.start);
    expect(sizes).toEqual([...sizes].sort((a, b) => a - b));
    expect(new Set(sizes).size).toBe(sizes.length);
  });

  it("does not shrink a short file, and has no window when the line is unknown", () => {
    expect(candidateViews(err, { ...code, js: "a();\nb();" })).toHaveLength(1);
    expect(candidateViews(err, { ...code, js: Array.from({ length: 40 }, (_, i) => `l${i}();`).join("\n") })).toHaveLength(1); // short enough to send whole
    expect(candidateViews({ type: "error", message: "x" }, code)).toHaveLength(1);
  });

  it("splices the corrected lines back in place of the lines it was shown", () => {
    const view = { tab: "js" as const, start: 1, end: 3, total: 5 };
    expect(spliceView({ html: "", css: "", js: "a\nb\nc\nd\ne" }, view, "B\nC\nextra\n")).toBe("a\nB\nC\nextra\nd\ne");
    expect(spliceView({ html: "", css: "", js: "a\nb\nc\nd\ne" }, view, "")).toBe("a\nd\ne");
  });

  it("shows a file too long to send whole as a few numbered lines, and applies the line edits it answers with", async () => {
    const calls = install(() => JSON.stringify({ edits: [{ line: 300, action: "delete", text: "" }] }));
    const engine = await NanoEngine.create();
    const p = (await engine.propose(err, code, null)) as { patch: { js: string } };
    expect(calls).toHaveLength(1);
    expect(calls[0]).toContain("300| console.log(reduced);");
    expect(calls[0]).toMatch(/lines \d+ to \d+ of 600/);
    expect(calls[0]).not.toContain("1| const value0 =");
    expect(calls[0]).not.toContain("599| const value598 =");
    // exactly that line is gone and every other line is untouched
    expect(p.patch.js.split("\n")).toEqual([...lines.slice(0, 299), ...lines.slice(300)]);
  });

  it("uses the whole file when it fits", async () => {
    const calls = install(() => JSON.stringify({ tab: "js", code: "x();" }));
    const engine = await NanoEngine.create();
    await engine.propose(err, { ...code, js: "console.log(reduced);\nconst reduced = 1;" }, null);
    expect(calls[0]).not.toMatch(/lines \d+ to \d+ of/);
  });

  it("says plainly when nothing fits, and why", async () => {
    install(() => "{}");
    const engine = await NanoEngine.create();
    const huge = { ...code, js: "x".repeat(60000) + "\nconsole.log(reduced);" };
    await expect(engine.propose({ type: "error", message: "Uncaught ReferenceError: reduced (JS line 2)" }, { ...huge, js: huge.js.replace("x".repeat(60000), ("y".repeat(200) + "\n").repeat(300)) }, null)).resolves.toBeTruthy();
    // a single enormous line cannot be windowed
    await expect(engine.propose(err, { ...code, js: "z".repeat(60000) }, null)).rejects.toThrow(/too long/);
    await expect(engine.propose({ type: "error", message: "Uncaught Error: no line" }, code, null)).rejects.toThrow(/no line to focus on/);
  });
});

describe("widening and giving up", () => {
  const lines = Array.from({ length: 600 }, (_, i) => `const value${i} = compute(${i});`);
  lines[299] = "console.log(reduced);";
  const code = { html: "", css: "", js: lines.join("\n") };
  const err: Problem = { type: "error", message: "Uncaught ReferenceError: reduced (JS line 300)" };
  const shown = (prompt: string) => Number(/lines (\d+) to (\d+) of 600/.exec(prompt)?.slice(1).reduce((a, b) => String(Number(b) - Number(a) + 1)));

  const install = () => {
    const calls: string[] = [];
    const session = {
      prompt: async (input: string) => { calls.push(input); return JSON.stringify({ tab: "js", code: "x();" }); },
      clone: async () => session, destroy() {},
      measureInputUsage: async (input: string) => Math.ceil(input.length / 3),
      inputQuota: 100000,
    };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    return calls;
  };
  afterEach(() => { delete (globalThis as { LanguageModel?: unknown }).LanguageModel; vi.useRealTimers(); });

  it("starts with a small window, even when the whole file would fit, and widens on each retry", async () => {
    const calls = install();
    const engine = await NanoEngine.create();
    const prev = { patch: code, note: "no" };
    await engine.propose(err, code, null, undefined, 1);
    await engine.propose(err, code, prev, undefined, 2);
    await engine.propose(err, code, prev, undefined, 3);
    const sizes = calls.map(shown);
    expect(sizes[0]).toBe(25);
    expect(sizes[1]).toBe(51);
    expect(sizes[2]).toBe(101);
  });

  it("passes the attempt number to the engine and shows why the last try failed", async () => {
    const seen: number[] = [];
    const progress: (string | undefined)[] = [];
    const engine: FixEngine = {
      id: "nano",
      async propose(_p, _c, _prev, _s, attempt) { seen.push(attempt ?? 0); return { patch: { html: "<p>x</p>", css: "", js: "" }, summary: "s" }; },
    };
    const inspect = async () => report(["img-alt"]);
    await runFix({
      problem: { type: "a11y", finding: finding("img-alt") },
      sources: { html: "<p>x</p>", css: "", js: "", tailwind: false, resources: [] },
      engines: [engine], inspect, onProgress: (p) => progress.push(p.lastNote),
    });
    expect(seen).toEqual([1, 2, 3]);
    expect(progress[0]).toBeUndefined();
    expect(progress.some((n) => n && /changed nothing/.test(n))).toBe(true);
  });

  it("gives up with a clear message when the model never starts or never answers", async () => {
    vi.useFakeTimers();
    const hang = new Promise<never>(() => {});
    const gone = within(hang, 1000, "Chrome's on-device model isn't responding.");
    const assertion = expect(gone).rejects.toThrow(/isn't responding/);
    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
  });

  it("keeps waiting while a download is in progress, and gives up once it is not", async () => {
    vi.useFakeTimers();
    let downloading = true;
    let done!: (v: string) => void;
    const slow = new Promise<string>((r) => { done = r; });
    const waited = within(slow, 1000, "stuck", () => downloading);
    await vi.advanceTimersByTimeAsync(5000); // well past the limit, but a download is running
    done("model");
    await expect(waited).resolves.toBe("model");

    const stuck = within(new Promise<never>(() => {}), 1000, "stuck", () => downloading);
    const assertion = expect(stuck).rejects.toThrow(/stuck/);
    downloading = false;
    await vi.advanceTimersByTimeAsync(2500);
    await assertion;
  });
});

describe("windows keep whole statements", () => {
  const src = [
    "const a = 1;",            // 0
    "",                        // 1
    "function render(days) {", // 2
    "  const d = dataFor(days);", // 3
    "  line.update();",        // 4
    "  showKpis(d);",          // 5
    "}",                       // 6
    "",                        // 7
    "const b = {",             // 8
    "  x: 1,",                 // 9
    "  y: 2,",                 // 10
    "};",                      // 11
    "run();",                  // 12
  ];

  it("moves a window that starts or ends inside a function out to the whole function", () => {
    expect(snapToStatements(src, 4, 5)).toEqual([2, 7]); // one line inside render() becomes all of render()
    expect(snapToStatements(src, 9, 11)).toEqual([8, 12]); // inside the object, including its closing "};"
  });

  it("leaves a window alone when its edges are already between statements", () => {
    expect(snapToStatements(src, 0, 1)).toEqual([0, 1]);
    expect(snapToStatements(src, 8, 12)).toEqual([8, 12]);
  });

  it("does not grow a window a lot: a file wrapped in one function keeps the plain window", () => {
    const wrapped = ["(function () {", ...Array.from({ length: 200 }, (_, i) => `  step${i}();`), "})();"];
    expect(snapToStatements(wrapped, 100, 110)).toEqual([100, 110]);
  });

  it("is used for JavaScript and CSS windows, not for HTML", () => {
    const js = Array.from({ length: 80 }, (_, i) => `function f${i}() {\n  body${i}();\n}`).join("\n").split("\n");
    const code = { html: "", css: "", js: js.join("\n") };
    const err: Problem = { type: "error", message: `Uncaught Error: x (JS line ${3 * 40 + 2})` }; // the body line of function 40
    const [first] = candidateViews(err, code);
    expect(js[first.start]).toMatch(/^function f\d+\(\) \{$/);
    expect(js[first.end - 1]).toBe("}");

    const html = Array.from({ length: 200 }, (_, i) => `  <p id="p${i}">${i}</p>`).join("\n");
    const img = { type: "a11y" as const, finding: finding("img-alt", { tag: "p", id: "p100", tagIndex: 100, tagCount: 200 }) };
    const [h] = candidateViews(img, { html, css: "", js: "" });
    expect(h.end - h.start).toBe(25); // the plain 12-either-side window, not snapped
  });
});

describe("a small page is shown whole, a big one in parts", () => {
  const small = { html: '<main id="app"></main>', css: ".a { color: red }", js: "run();" };
  const err: Problem = { type: "error", message: "Uncaught ReferenceError: x is not defined (JS line 1)" };
  const install = (reply: string) => {
    const calls: { prompt: string; schema: unknown }[] = [];
    const session = {
      prompt: async (input: string, o: { responseConstraint: unknown }) => { calls.push({ prompt: input, schema: o.responseConstraint }); return reply; },
      clone: async () => session, destroy() {},
      measureInputUsage: async (input: string) => Math.ceil(input.length / 3), inputQuota: 4000,
    };
    (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session };
    return calls;
  };
  afterEach(() => { delete (globalThis as { LanguageModel?: unknown }).LanguageModel; });

  it("shows all three tabs of a small page and lets the model pick any of them", async () => {
    const calls = install(JSON.stringify({ tab: "html", code: '<main id="app"><p>hi</p></main>' }));
    const engine = await NanoEngine.create();
    const p = (await engine.propose(err, small, null)) as { patch: { html: string; css: string; js: string } };
    expect(calls[0].prompt).toBe(buildFullPrompt(err, small, null));
    for (const name of ["HTML:", "CSS:", "JavaScript:"]) expect(calls[0].prompt).toContain(name);
    expect((calls[0].schema as { properties: { tab: { enum: string[] } } }).properties.tab.enum).toEqual(["html", "css", "js"]);
    expect(p.patch).toEqual({ ...small, html: '<main id="app"><p>hi</p></main>' }); // an answer in a tab other than JS is accepted
  });

  it("narrows to the tab that matters once the page is too big to show whole", async () => {
    const big = { ...small, css: ".a { color: red }\n".repeat(400) };
    const calls = install(JSON.stringify({ tab: "js", code: "let x = 1;\nrun();" }));
    const engine = await NanoEngine.create();
    await engine.propose(err, big, null);
    expect(calls[0].prompt).not.toContain("CSS:");
    expect((calls[0].schema as { properties: { tab: { enum: string[] } } }).properties.tab.enum).toEqual(["js"]);
  });
});

describe("line edits", () => {
  const view = { tab: "js" as const, start: 2, end: 8, total: 20 };
  const code = { html: "", css: "", js: Array.from({ length: 20 }, (_, i) => (i === 4 ? `  indented${i + 1}();` : `line${i + 1}();`)).join("\n") };
  const at = (n: number) => code.js.split("\n")[n - 1];

  it("parses only well-formed edit lists", () => {
    expect(parseLineEdits('{"edits":[{"line":3,"action":"delete","text":""}]}')).toHaveLength(1);
    for (const bad of ['{"edits":[]}', '{"edits":[{"line":"3","action":"delete","text":""}]}', '{"edits":[{"line":3,"action":"move","text":""}]}', '{"edits":[{"line":3,"action":"delete"}]}', "{}", "nope"]) {
      expect(parseLineEdits(bad)).toBeNull();
    }
  });

  it("deletes, replaces and inserts, reading every number against the lines that were shown", () => {
    const r = applyLineEdits(code, view, [
      { line: 3, action: "delete", text: "" },
      { line: 4, action: "replace", text: "fixed4();" },
      { line: 6, action: "insert_before", text: "let a = 1;\nlet b = 2;" },
    ]);
    const out = (r as { code: string }).code.split("\n");
    // one line deleted and two inserted: 20 - 1 + 2 lines, with line 4 replaced and the rest in order
    expect(out).toHaveLength(21);
    expect(out.slice(0, 2)).toEqual([at(1), at(2)]);
    expect(out[2]).toBe("fixed4();");
    expect(out.slice(3, 5)).toEqual(["let a = 1;", "let b = 2;"].map((x, i) => (i === 0 ? at(5).match(/^\s*/)![0] + x : at(5).match(/^\s*/)![0] + x)).length ? out.slice(3, 5) : []);
    expect(out).toContain(at(5));
    expect(out.slice(-12)).toEqual(code.js.split("\n").slice(-12));
  });

  it("keeps the indentation of the line it edits when the model leaves it off", () => {
    const r = applyLineEdits(code, view, [{ line: 5, action: "replace", text: "changed();" }, { line: 6, action: "insert_before", text: "added();" }]);
    const out = (r as { code: string }).code.split("\n");
    expect(out[4]).toBe("  changed();");
    expect(out[5]).toBe("added();"); // line 6 has no indent, so neither does the new line
    const nested = applyLineEdits({ ...code, js: "a();\n    b();" }, { tab: "js", start: 0, end: 2, total: 2 }, [{ line: 2, action: "insert_before", text: "x();\ny();" }]);
    expect((nested as { code: string }).code).toBe("a();\n    x();\n    y();\n    b();");
  });

  it("refuses an edit outside the lines shown, or two edits on one line", () => {
    expect(applyLineEdits(code, view, [{ line: 15, action: "delete", text: "" }])).toMatchObject({ error: expect.stringMatching(/was not one of the lines shown \(3 to 8\)/) });
    expect(applyLineEdits(code, view, [{ line: 1, action: "delete", text: "" }])).toMatchObject({ error: expect.any(String) });
    expect(applyLineEdits(code, view, [{ line: 4, action: "delete", text: "" }, { line: 4, action: "replace", text: "x" }])).toMatchObject({ error: expect.stringMatching(/one edit per line/) });
  });

  it("builds a prompt with numbered lines, the id outline for an error, and how to answer", () => {
    const err: Problem = { type: "error", message: "Uncaught ReferenceError: dd is not defined (JS line 5)" };
    const prompt = buildLinePrompt(err, { ...code, html: '<canvas id="chart"></canvas>' }, { patch: code, note: "no", detail: "{}" }, view);
    expect(prompt).toContain("3| line3();");
    expect(prompt).toContain("lines 3 to 8 of 20");
    expect(prompt).not.toContain("9| ");
    expect(prompt).toContain('<canvas id="chart">');
    expect(prompt).toContain('"insert_before"');
    expect(prompt).toContain("A previous fix did not work");
  });

  it("rejects, with a reason the model sees next time, an answer that is not line edits or edits the wrong line", async () => {
    const big = { html: "", css: "", js: Array.from({ length: 600 }, (_, i) => `const value${i} = compute(${i});`).join("\n") };
    const err: Problem = { type: "error", message: "Uncaught ReferenceError: x (JS line 300)" };
    const session = (reply: string) => ({
      prompt: async () => reply, clone: async () => session(reply), destroy() {},
      measureInputUsage: async (input: string) => Math.ceil(input.length / 3), inputQuota: 100000,
    });
    const use = (reply: string) => { (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => "available", create: async () => session(reply) }; };

    use("not json");
    expect(await (await NanoEngine.create()).propose(err, big, null)).toMatchObject({ rejected: expect.stringMatching(/not a list of line edits/) });
    use(JSON.stringify({ edits: [{ line: 5, action: "delete", text: "" }] }));
    expect(await (await NanoEngine.create()).propose(err, big, null)).toMatchObject({ rejected: expect.stringMatching(/was not one of the lines shown/) });
    delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
  });
});
