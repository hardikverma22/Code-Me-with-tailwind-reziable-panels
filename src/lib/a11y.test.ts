import { locateInHtml, runA11yChecks } from "./a11y";
import { buildSrcDoc } from "./buildSrcDoc";

const check = (body: string) => {
  document.head.innerHTML = "";
  document.body.innerHTML = body;
  return runA11yChecks(document);
};
const rules = (body: string) => check(body).map((f) => f.rule);

describe("runA11yChecks", () => {
  it("passes a well-formed page", () => {
    expect(
      check(`<main><h1>Title</h1><h2>Sub</h2><img src="a.png" alt="A cat"><label for="n">Name</label><input id="n">
        <button>Save</button><a href="/x">Read more</a></main>`)
    ).toEqual([]);
  });

  it("flags images without alt but accepts empty alt as decoration", () => {
    expect(rules('<img src="a.png">')).toEqual(["img-alt"]);
    expect(rules('<img src="a.png" alt="">')).toEqual([]);
  });

  it("flags form fields without a label, and accepts the usual ways to label one", () => {
    expect(rules("<input>")).toEqual(["form-label"]);
    expect(rules("<select></select><textarea></textarea>")).toEqual(["form-label", "form-label"]);
    expect(rules('<label>Email <input type="email"></label>')).toEqual([]);
    expect(rules('<label for="q">Search</label><input id="q">')).toEqual([]);
    expect(rules('<input aria-label="Search">')).toEqual([]);
    expect(rules('<span id="l">Name</span><input aria-labelledby="l">')).toEqual([]);
    expect(rules('<input type="hidden"><input type="submit">')).toEqual([]);
  });

  it("flags buttons and links with no name", () => {
    expect(rules("<button></button>")).toEqual(["button-name"]);
    expect(rules('<a href="/x"><svg></svg></a>')).toEqual(["link-name"]);
    expect(rules('<button aria-label="Close"><svg></svg></button>')).toEqual([]);
    expect(rules('<a href="/x"><img src="a.png" alt="Home"></a>')).toEqual([]);
    expect(rules("<a>no href, not a link</a>")).toEqual([]);
  });

  it("flags duplicate ids, positive tabindex and skipped heading levels", () => {
    expect(rules('<p id="a"></p><p id="a"></p>')).toEqual(["duplicate-id"]);
    expect(rules('<div tabindex="3"></div><div tabindex="0"></div>')).toEqual(["tabindex-positive"]);
    expect(rules("<h1>a</h1><h3>b</h3>")).toEqual(["heading-order"]);
    expect(rules("<h2>a</h2><h3>b</h3><h2>c</h2>")).toEqual([]);
  });

  it("ignores hidden elements", () => {
    expect(rules('<div hidden><img src="a.png"></div>')).toEqual([]);
    expect(rules('<div style="display:none"><button></button></div>')).toEqual([]);
  });

  it("reports colour contrast against the effective background", () => {
    const low = check('<p style="color:#999;background:#fff">faint</p>');
    expect(low).toHaveLength(1);
    expect(low[0].rule).toBe("color-contrast");
    expect(low[0].message).toMatch(/2\.8\d:1 but 4\.5:1/);
    expect(rules('<p style="color:#000;background:#fff">fine</p>')).toEqual([]);
    expect(rules('<div style="background:#000"><p style="color:#fff">inverse</p></div>')).toEqual([]);
    expect(rules('<div style="background:#000"><p style="color:#222">dark on dark</p></div>')).toEqual(["color-contrast"]);
  });

  it("lets large text pass at 3:1", () => {
    const style = "color:#8a8a8a;background:#fff";
    expect(rules(`<p style="${style};font-size:14px">small</p>`)).toEqual(["color-contrast"]);
    expect(rules(`<p style="${style};font-size:28px">big</p>`)).toEqual([]);
  });

  it("skips contrast when a background image sits behind the text", () => {
    expect(rules('<div style="background-image:url(x.png)"><p style="color:#ccc">over a photo</p></div>')).toEqual([]);
  });

  it("describes where the element is", () => {
    const [f] = check('<p></p><img id="hero" src="a.png"><img src="b.png">');
    expect(f).toMatchObject({ tag: "img", id: "hero", tagIndex: 0, tagCount: 2 });
    expect(f.snippet).toContain('id="hero"');
  });
});

describe("locateInHtml", () => {
  const html = "<h1>x</h1>\n<img src=a>\n\n<img id=\"two\" src=b>";
  it("finds an element by id", () => {
    expect(locateInHtml(html, { tag: "img", id: "two", tagIndex: 1, tagCount: 2 })).toBe(4);
  });
  it("finds the nth tag when the counts agree", () => {
    expect(locateInHtml(html, { tag: "img", id: null, tagIndex: 0, tagCount: 2 })).toBe(2);
    expect(locateInHtml(html, { tag: "h1", id: null, tagIndex: 0, tagCount: 1 })).toBe(1);
  });
  it("gives up when scripts added elements the source does not contain", () => {
    expect(locateInHtml(html, { tag: "img", id: null, tagIndex: 3, tagCount: 5 })).toBeNull();
  });
});

describe("preview wiring", () => {
  it("ships the checker into the sandboxed document and reports back to the parent", () => {
    const doc = buildSrcDoc({ html: "<p>x</p>", css: "", js: "" });
    expect(doc).toContain("img-alt");
    expect(doc).toContain('kind: "a11y"');
    // the document must stay a single, well-formed script block
    expect(doc.match(/<\/script/gi)?.length).toBe(doc.match(/<script/gi)?.length);
  });
});
