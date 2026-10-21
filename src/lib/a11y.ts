export type A11yFinding = {
  rule: "img-alt" | "form-label" | "button-name" | "link-name" | "color-contrast" | "heading-order" | "duplicate-id" | "tabindex-positive";
  severity: "error" | "warning";
  message: string;
  /** Opening tag of the element, trimmed. */
  snippet: string;
  tag: string;
  id: string | null;
  /** 0-based position among the document's elements with this tag, and how many there are. */
  tagIndex: number;
  tagCount: number;
};

/** Posted by the preview iframe when it has finished checking itself. */
export type A11yMessage = { source: "codeme-preview"; kind: "a11y"; findings: A11yFinding[] };

/**
 * Runs inside the sandboxed preview, where the page's DOM lives. It is serialised into the iframe
 * with `toString()`, so it must stay self-contained: no imports, no references to module scope.
 * Checks are the ones a static DOM can answer reliably; colour contrast is skipped for text over images.
 */
export function runA11yChecks(doc: Document): A11yFinding[] {
  const out: A11yFinding[] = [];
  const win = doc.defaultView as Window & typeof globalThis;
  const body = doc.body;
  if (!body) return out;
  const MAX = 60;

  const openTag = (el: Element) => {
    const s = el.outerHTML.slice(0, el.outerHTML.indexOf(">") + 1);
    return s.length > 140 ? s.slice(0, 137) + "..." : s;
  };
  const add = (rule: A11yFinding["rule"], severity: A11yFinding["severity"], el: Element, message: string) => {
    if (out.length >= MAX) return;
    const tag = el.tagName.toLowerCase();
    const same = Array.from(doc.getElementsByTagName(tag)).filter((e) => !e.closest("head"));
    out.push({ rule, severity, message, snippet: openTag(el), tag, id: el.getAttribute("id"), tagIndex: same.indexOf(el), tagCount: same.length });
  };
  const hidden = (el: Element) => {
    for (let e: Element | null = el; e && e !== doc.documentElement; e = e.parentElement) {
      if (e.hasAttribute("hidden") || e.getAttribute("aria-hidden") === "true") return true;
      const s = win.getComputedStyle(e);
      if (s.display === "none" || s.visibility === "hidden") return true;
    }
    return false;
  };
  const text = (el: Element) => (el.textContent || "").replace(/\s+/g, " ").trim();
  const labelledBy = (el: Element) => {
    const ids = (el.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean);
    return ids.map((id) => doc.getElementById(id)).filter(Boolean).map((e) => text(e as Element)).join(" ").trim();
  };
  const hasName = (el: Element) =>
    Boolean(
      text(el) || (el.getAttribute("aria-label") || "").trim() || labelledBy(el) || (el.getAttribute("title") || "").trim() ||
        Array.from(el.querySelectorAll("img[alt], svg title, [aria-label]")).some((c) => (c.getAttribute("alt") || c.getAttribute("aria-label") || c.textContent || "").trim())
    );

  doc.querySelectorAll("img").forEach((img) => {
    if (!img.hasAttribute("alt") && img.getAttribute("role") !== "presentation" && !hidden(img)) {
      add("img-alt", "error", img, "Image has no alt attribute. Describe it, or use alt=\"\" if it is decoration.");
    }
  });

  doc.querySelectorAll("input, select, textarea").forEach((c) => {
    const type = (c.getAttribute("type") || "text").toLowerCase();
    if (c.tagName === "INPUT" && ["hidden", "submit", "button", "reset", "image"].includes(type)) return;
    if (hidden(c)) return;
    const id = c.getAttribute("id");
    const labelled =
      (c.getAttribute("aria-label") || "").trim() || labelledBy(c) || (c.getAttribute("title") || "").trim() ||
      c.closest("label") || (id && Array.from(doc.getElementsByTagName("label")).some((l) => l.htmlFor === id));
    if (!labelled) add("form-label", "error", c, "Form field has no label. Add a <label for>, wrap it in a <label>, or set aria-label.");
  });

  doc.querySelectorAll("button, [role=button]").forEach((b) => {
    if (!hidden(b) && !hasName(b)) add("button-name", "error", b, "Button has no accessible name. Give it text or an aria-label.");
  });
  doc.querySelectorAll("a[href]").forEach((a) => {
    if (!hidden(a) && !hasName(a)) add("link-name", "error", a, "Link has no accessible name. Give it text or an aria-label.");
  });

  const seen = new Set<string>();
  doc.querySelectorAll("[id]").forEach((el) => {
    const id = el.getAttribute("id") || "";
    if (id && seen.has(id)) add("duplicate-id", "error", el, `The id "${id}" is used more than once.`);
    seen.add(id);
  });

  doc.querySelectorAll("[tabindex]").forEach((el) => {
    if (Number(el.getAttribute("tabindex")) > 0) add("tabindex-positive", "warning", el, "A positive tabindex changes the tab order. Use 0, or reorder the HTML.");
  });

  let last = 0;
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((h) => {
    if (hidden(h)) return;
    const level = Number(h.tagName[1]);
    if (last && level > last + 1) add("heading-order", "warning", h, `Heading jumps from h${last} to h${level}. Don't skip levels.`);
    last = level;
  });

  // ---- colour contrast (WCAG 2.1 AA) ----
  type RGBA = [number, number, number, number];
  let canvas: CanvasRenderingContext2D | null = null;
  const parse = (value: string): RGBA | null => {
    const m = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/.exec(value.trim());
    if (m) {
      const a = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [Number(m[1]), Number(m[2]), Number(m[3]), a];
    }
    // Modern browsers keep oklch(), color-mix() and friends as written; a canvas turns any CSS colour into pixels.
    try {
      if (!canvas) canvas = doc.createElement("canvas").getContext("2d", { willReadFrequently: true });
      if (!canvas) return null;
      canvas.clearRect(0, 0, 1, 1);
      canvas.fillStyle = "#000";
      canvas.fillStyle = value;
      canvas.fillRect(0, 0, 1, 1);
      const d = canvas.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], d[3] / 255];
    } catch {
      return null;
    }
  };
  const over = (top: RGBA, under: RGBA): RGBA => {
    const a = top[3] + under[3] * (1 - top[3]);
    if (a === 0) return [0, 0, 0, 0];
    const mix = (i: number) => (top[i] * top[3] + under[i] * under[3] * (1 - top[3])) / a;
    return [mix(0), mix(1), mix(2), a];
  };
  const lum = (c: RGBA) => {
    const f = (v: number) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
  };
  const ratio = (a: RGBA, b: RGBA) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  // The colour a text element sits on, or null when an image or gradient is behind it.
  const backdrop = (el: Element): RGBA | null => {
    const layers: RGBA[] = [];
    for (let e: Element | null = el; e; e = e.parentElement) {
      const s = win.getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== "none") return null;
      const bg = parse(s.backgroundColor);
      if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) break; }
    }
    let acc: RGBA = [255, 255, 255, 1];
    for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  };

  // Contrast needs computed styles up the tree for every text element; skip it on very large pages.
  const candidates = body.getElementsByTagName("*").length > 1500 ? [] : Array.from(doc.querySelectorAll("body *"));
  const checked = new Set<Element>();
  candidates.forEach((el) => {
    if (checked.has(el) || ["SCRIPT", "STYLE", "NOSCRIPT", "SVG", "OPTION"].includes(el.tagName.toUpperCase())) return;
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.nodeValue || "").trim() !== "");
    if (!own || hidden(el)) return;
    checked.add(el);
    const s = win.getComputedStyle(el);
    const fg = parse(s.color);
    const bg = backdrop(el);
    if (!fg || !bg) return;
    const solid = fg[3] < 1 ? over(fg, bg) : fg;
    const r = ratio(solid, bg);
    const px = parseFloat(s.fontSize) || 16;
    const bold = Number(s.fontWeight) >= 700 || s.fontWeight === "bold";
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (r < need) add("color-contrast", "error", el, `Contrast is ${r.toFixed(2)}:1 but ${need}:1 is needed for ${large ? "large" : "normal"} text.`);
  });

  return out;
}

/**
 * Best-effort 1-based line in the HTML tab for a finding. Looks for the element's id first, then
 * the nth tag of that kind, but only when the HTML holds as many of that tag as the rendered page
 * (scripts may add elements, which would make the count point at the wrong one).
 */
export function locateInHtml(html: string, f: Pick<A11yFinding, "tag" | "id" | "tagIndex" | "tagCount">): number | null {
  const lineOf = (index: number) => html.slice(0, index).split("\n").length;
  if (f.id) {
    const esc = f.id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = new RegExp(`\\bid\\s*=\\s*["']${esc}["']`).exec(html);
    if (m) return lineOf(m.index);
  }
  const re = new RegExp(`<${f.tag}(?=[\\s/>])`, "gi");
  const starts: number[] = [];
  for (let m = re.exec(html); m; m = re.exec(html)) starts.push(m.index);
  if (starts.length !== f.tagCount || f.tagIndex < 0 || f.tagIndex >= starts.length) return null;
  return lineOf(starts[f.tagIndex]);
}
