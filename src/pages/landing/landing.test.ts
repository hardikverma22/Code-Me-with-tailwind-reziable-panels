import { fakeInspect } from "../../lib/fix/fakeInspect";
import { rulesEngine } from "../../lib/fix/rules";
import { brokenPlan, builtPlan } from "./example";

const raw = import.meta.glob("./*.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const nav = import.meta.glob("../../components/SiteNav.tsx", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const source = Object.values(raw).join("\n");
const count = (text: string, needle: string) => text.split(needle).length - 1;

describe("landing page calls to action", () => {
  it("gives each action its own label, and uses each once", () => {
    // "Read the source" is set as two styled spans, so check its second half.
    for (const label of ["Start coding", "Open this page in the editor", "Browse all", ">the source<"]) {
      expect(count(source, label), `"${label}" should appear once`).toBe(1);
    }
  });

  it("no longer repeats the old actions", () => {
    for (const old of ["Keep going in the full editor", "Start building", "Browse templates", "Open editor"]) {
      expect(source.includes(old), `"${old}" should be gone from the landing page`).toBe(false);
    }
  });

  it("keeps the nav free of a button, so the hero owns the main action", () => {
    expect(raw["./Hero.tsx"]).toContain("cta={false}");
    expect(Object.values(nav)[0]).toContain("{cta &&");
  });

  it("has one editor-opening button for a blank page, and one that carries the demo's code", () => {
    expect(count(raw["./Hero.tsx"], 'navigate("/new")')).toBe(1);
    expect(raw["./Fix.tsx"]).toContain('load({ ...code, tailwind: false, resources: [] }, null)');
    expect(raw["./Close.tsx"]).not.toContain("/new");
  });
});

describe("the example", () => {
  it("is not a bare 'Press me' button anywhere", () => {
    expect(source).not.toMatch(/Press me|Pressed \d|Pressed 0/);
  });

  it("is written well in the build sequence: the checker finds nothing to fix", async () => {
    const r = await fakeInspect({ ...builtPlan, html: builtPlan.html, tailwind: false, resources: [] });
    expect(r.findings.map((f) => f.rule)).toEqual([]);
  });

  it("is broken in the fix demo in exactly the ways the page says", async () => {
    const r = await fakeInspect({ ...brokenPlan, tailwind: false, resources: [] });
    expect(r.findings.map((f) => f.rule).sort()).toEqual(["button-name", "color-contrast", "form-label", "heading-order"]);

    // the fifth problem is the JavaScript error at load: `plan` is used but never declared
    const run = (js: string) => new Function("price", "yearly", js)({ textContent: "" }, {});
    expect(() => run(brokenPlan.js)).toThrow(/plan is not defined/);
    expect(() => run(`let plan = "monthly";\n${brokenPlan.js}`)).not.toThrow();
  });

  it("is fixed by rules where it can be, and leaves the rest for the model", async () => {
    let page = { html: brokenPlan.html as string, css: brokenPlan.css as string, js: brokenPlan.js as string };
    const handled: string[] = [];
    for (const rule of ["form-label", "heading-order", "color-contrast"] as const) {
      const report = await fakeInspect({ ...page, tailwind: false, resources: [] });
      const finding = report.findings.find((f) => f.rule === rule)!;
      const p = await rulesEngine.propose({ type: "a11y", finding }, page, null);
      expect(p, `a rule should fix ${rule}`).not.toBeNull();
      page = p!.patch as typeof page;
      handled.push(rule);
    }
    const after = await fakeInspect({ ...page, tailwind: false, resources: [] });
    expect(after.findings.map((f) => f.rule)).toEqual(["button-name"]);
    // nothing else was touched: the CSS still styles the tagline by class, not by the h3 tag
    expect(page.css).toContain(".tagline");
    expect(page.html).toContain("<h2 class=\"tagline\">");
    // and no rule claims the icon-only button, which needs a human or the model to name it
    const finding = after.findings[0];
    expect(await rulesEngine.propose({ type: "a11y", finding }, page, null)).toBeNull();
  });
});
