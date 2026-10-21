import type { A11yFinding } from "../a11y";
import { contrastRatio, passingColor, toHex } from "./contrast";
import { fakeInspect } from "./fakeInspect";
import { allTags, findTag, getAttr, indentAt, setAttr } from "./locate";
import { rulesEngine } from "./rules";
import type { Patch } from "./types";

const code = (html: string, css = "", js = ""): Patch => ({ html, css, js });

/** Runs the rule for the first finding of `rule`, then re-checks the patched page with the real checker. */
async function fixAndRecheck(rule: A11yFinding["rule"], page: Patch) {
  const before = await fakeInspect(page);
  const finding = before.findings.find((f) => f.rule === rule);
  if (!finding) throw new Error(`setup: no ${rule} finding in the page`);
  const proposal = await rulesEngine.propose({ type: "a11y", finding }, page, null);
  if (!proposal) return { proposal: null, before, after: null };
  const after = await fakeInspect({ ...proposal.patch, tailwind: false });
  return { proposal, before, after };
}
const count = (r: { findings: A11yFinding[] }, rule: string) => r.findings.filter((f) => f.rule === rule).length;

describe("locate helpers", () => {
  const html = '<p>a</p>\n  <img src="x.png" alt="">\n  <img id="hero" data-x=">" src="y.png">';

  it("finds opening tags, including quoted attribute values that contain >", () => {
    const tags = allTags(html, "img");
    expect(tags.map((t) => t.text)).toEqual(['<img src="x.png" alt="">', '<img id="hero" data-x=">" src="y.png">']);
  });

  it("finds the tag a finding is about by id, or by position when the counts agree", () => {
    expect(findTag(html, { tag: "img", id: "hero", tagIndex: 9, tagCount: 9 })?.text).toContain('id="hero"');
    expect(findTag(html, { tag: "img", id: null, tagIndex: 0, tagCount: 2 })?.text).toContain("x.png");
    expect(findTag(html, { tag: "img", id: null, tagIndex: 0, tagCount: 3 })).toBeNull();
    expect(findTag(html, { tag: "img", id: null, tagIndex: 5, tagCount: 2 })).toBeNull();
  });

  it("reads and sets attributes", () => {
    const tag = '<input type="email" required class=\'a b\'>';
    expect(getAttr(tag, "type")).toBe("email");
    expect(getAttr(tag, "class")).toBe("a b");
    expect(getAttr(tag, "required")).toBe("");
    expect(getAttr(tag, "name")).toBeNull();
    expect(setAttr(tag, "id", "e")).toBe('<input type="email" required class=\'a b\' id="e">');
    expect(setAttr(tag, "type", "text")).toBe('<input type="text" required class=\'a b\'>');
    expect(setAttr("<br />", "x", "1")).toBe('<br x="1" />');
  });

  it("reports the indentation of a line", () => {
    expect(indentAt("a\n    <b>", 6)).toBe("    ");
    expect(indentAt("<b>", 0)).toBe("");
  });
});

describe("contrast helpers", () => {
  it("finds the closest colour that passes, in the right direction", () => {
    const light = passingColor([170, 170, 170], [255, 255, 255], 4.5)!;
    expect(contrastRatio(light, [255, 255, 255])).toBeGreaterThanOrEqual(4.5);
    expect(light[0]).toBeLessThan(170); // darker text on a light page
    const dark = passingColor([60, 60, 60], [0, 0, 0], 4.5)!;
    expect(contrastRatio(dark, [0, 0, 0])).toBeGreaterThanOrEqual(4.5);
    expect(dark[0]).toBeGreaterThan(60); // lighter text on a dark page
  });
  it("does not move a colour that already passes much, and gives up when nothing can pass", () => {
    expect(passingColor([0, 0, 0], [255, 255, 255], 4.5)).toEqual([0, 0, 0]);
    expect(passingColor([120, 120, 120], [119, 119, 119], 7)).toBeNull();
  });
  it("formats hex", () => {
    expect(toHex([255, 0, 10])).toBe("#ff000a");
  });
});

describe("rules engine, checked with the real accessibility checker", () => {
  it("labels a field and connects it", async () => {
    const { proposal, before, after } = await fixAndRecheck("form-label", code('<h1>Join</h1>\n<input type="email" placeholder="Email">'));
    expect(proposal!.patch.html).toBe('<h1>Join</h1>\n<label for="email">Email</label>\n<input type="email" placeholder="Email" id="email">');
    expect(count(before, "form-label")).toBe(1);
    expect(count(after!, "form-label")).toBe(0);
  });

  it("keeps an id the field already has", async () => {
    const { proposal, after } = await fixAndRecheck("form-label", code('<input id="who" name="full_name">'));
    expect(proposal!.patch.html).toBe('<label for="who">Full name</label>\n<input id="who" name="full_name">');
    expect(count(after!, "form-label")).toBe(0);
  });

  it("picks an id that is not taken", async () => {
    const { proposal } = await fixAndRecheck("form-label", code('<p id="email">x</p><input type="email">'));
    expect(proposal!.patch.html).toContain('id="email-2"');
  });

  it("raises a skipped heading by one level, opening and closing tag", async () => {
    const { proposal, after } = await fixAndRecheck("heading-order", code("<h1>Shop</h1>\n<h3 class=\"x\">Featured</h3>\n<p>a</p>"));
    expect(proposal!.patch.html).toBe('<h1>Shop</h1>\n<h2 class="x">Featured</h2>\n<p>a</p>');
    expect(count(after!, "heading-order")).toBe(0);
  });

  it("leaves a heading alone when CSS or JavaScript selects it by tag name", async () => {
    const styled = await fixAndRecheck("heading-order", code("<h1>Shop</h1>\n<h3>Featured</h3>", "h3 { color: red }"));
    expect(styled.proposal).toBeNull();
    const scripted = await fixAndRecheck("heading-order", code("<h1>Shop</h1>\n<h3>Featured</h3>", "", 'document.querySelector("h3")'));
    expect(scripted.proposal).toBeNull();
    // a class that merely contains the text is not a selector on the tag
    const classed = await fixAndRecheck("heading-order", code('<h1>Shop</h1>\n<h3 class="h3-ish">Featured</h3>', ".h3-ish { color: red }"));
    expect(classed.proposal?.patch.html).toContain("<h2");
  });

  it("resets a positive tabindex", async () => {
    const { proposal, after } = await fixAndRecheck("tabindex-positive", code('<div tabindex="0"></div><div tabindex="5">x</div>'));
    expect(proposal!.patch.html).toBe('<div tabindex="0"></div><div tabindex="0">x</div>');
    expect(count(after!, "tabindex-positive")).toBe(0);
  });

  it("marks an image as decoration and says so", async () => {
    const { proposal, after } = await fixAndRecheck("img-alt", code('<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=">'));
    expect(proposal!.patch.html).toContain('alt=""');
    expect(proposal!.summary).toMatch(/decoration/);
    expect(count(after!, "img-alt")).toBe(0);
  });

  it("renames a duplicate id only when nothing refers to it", async () => {
    const ok = await fixAndRecheck("duplicate-id", code('<p id="a">1</p><p id="a">2</p>'));
    expect(ok.proposal!.patch.html).toBe('<p id="a">1</p><p id="a-2">2</p>');
    expect(count(ok.after!, "duplicate-id")).toBe(0);

    const referenced = await fixAndRecheck("duplicate-id", code('<a href="#a">go</a><p id="a">1</p><p id="a">2</p>'));
    expect(referenced.proposal).toBeNull();
    const styled = await fixAndRecheck("duplicate-id", code('<p id="a">1</p><p id="a">2</p>', "#a { margin: 0 }"));
    expect(styled.proposal).toBeNull();
    const scripted = await fixAndRecheck("duplicate-id", code('<p id="a">1</p><p id="a">2</p>', "", 'document.getElementById("a")'));
    expect(scripted.proposal).toBeNull();
  });

  describe("colour contrast", () => {
    it("rewrites an inline colour", async () => {
      const { proposal, after } = await fixAndRecheck("color-contrast", code('<p style="color:#aaa; font-size:14px">Sale</p>'));
      expect(proposal!.patch.html).toMatch(/style="color: #[0-9a-f]{6}; font-size:14px"/);
      expect(count(after!, "color-contrast")).toBe(0);
    });

    it("rewrites the colour in the class rule that sets it, and leaves other rules alone", async () => {
      const css = ".other { color: #aaa; }\n.note {\n  color: #aaa;\n  background-color: #fff;\n}\n.note:hover { color: #bbb; }";
      const { proposal, after } = await fixAndRecheck("color-contrast", code('<p class="note">Sale</p>', css));
      const out = proposal!.patch.css;
      expect(out).toContain(".other { color: #aaa; }");
      expect(out).toContain("background-color: #fff;");
      expect(out).toContain(".note:hover { color: #bbb; }");
      expect(out).toMatch(/\.note \{\n {2}color: #[0-9a-f]{6};/);
      expect(proposal!.summary).toMatch(/reaches 4\.5:1/);
      expect(count(after!, "color-contrast")).toBe(0);
    });

    it("finds the rule through a parent selector and a tag selector", async () => {
      const { proposal } = await fixAndRecheck("color-contrast", code('<section><p>Sale</p></section>', "section p { color: #aaa }"));
      expect(proposal!.patch.css).toMatch(/section p \{ color: #[0-9a-f]{6}/);
    });

    it("gives up when the colour comes from somewhere it cannot edit", async () => {
      // jsdom does not inherit colour, so build the finding a real browser would report for this page:
      // the colour is declared on the parent, not on the <p> or in any rule for it.
      const finding: A11yFinding = {
        rule: "color-contrast", severity: "error", message: "", snippet: "<p>", tag: "p", id: null, tagIndex: 0, tagCount: 1,
        fg: [170, 170, 170], bg: [255, 255, 255], need: 4.5,
      };
      const inheritedPage = code('<div class="box"><p>Sale</p></div>', ".box { color: #aaa; }");
      expect(await rulesEngine.propose({ type: "a11y", finding }, inheritedPage, null)).toBeNull();
      // jsdom cannot resolve var() either, so the same finding stands in for this page.
      const variablePage = code('<p class="n">Sale</p>', ".n { color: var(--x, #aaa); }");
      expect(await rulesEngine.propose({ type: "a11y", finding }, variablePage, null)).toBeNull();
    });
  });

  it("has nothing for problems that need judgement or a runtime", async () => {
    const button = await fixAndRecheck("button-name", code('<button><svg width="8" height="8"></svg></button>'));
    expect(button.proposal).toBeNull();
    const finding = (await fakeInspect({ ...code("<p>x</p>"), tailwind: false })).findings[0];
    expect(await rulesEngine.propose({ type: "error", message: "ReferenceError: x is not defined" }, code("<p>x</p>"), null)).toBeNull();
    expect(finding).toBeUndefined();
  });

  it("answers once: a retry gets nothing", async () => {
    const before = await fakeInspect({ ...code("<input>"), tailwind: false });
    const f = before.findings[0];
    expect(await rulesEngine.propose({ type: "a11y", finding: f }, code("<input>"), { patch: code("<input>"), note: "no" })).toBeNull();
  });
});
