import type { A11yFinding } from "../a11y";
import { passingColor, toHex } from "./contrast";
import { allTags, findTag, getAttr, indentAt, replaceRange, setAttr } from "./locate";
import type { Attempt, FixEngine, Patch, Problem, Proposal } from "./types";

/**
 * Fixes that need no model: the change is mechanical and its meaning is fixed by the rule. Every one
 * still goes through the sandbox check before it is offered, so a rule that misjudges a page is caught.
 */
type Rule = (f: A11yFinding, code: Patch) => Proposal | null;

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const humanize = (s: string) => {
  const t = s.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "";
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "field";

const usedIds = (html: string) => new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]));
const uniqueId = (html: string, base: string) => {
  const used = usedIds(html);
  let id = base;
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
  return id;
};

const formLabel: Rule = (f, code) => {
  const hit = findTag(code.html, f);
  if (!hit) return null;
  const text =
    humanize(getAttr(hit.text, "placeholder") ?? "") ||
    humanize(getAttr(hit.text, "name") ?? "") ||
    (() => { const t = getAttr(hit.text, "type"); return t && t !== "text" ? humanize(t) : ""; })() ||
    humanize(f.tag);
  const existing = getAttr(hit.text, "id");
  const id = existing || uniqueId(code.html, slug(getAttr(hit.text, "name") || getAttr(hit.text, "type") || f.tag));
  const tag = existing ? hit.text : setAttr(hit.text, "id", id);
  const label = `<label for="${id}">${escapeHtml(text)}</label>\n${indentAt(code.html, hit.start)}`;
  return {
    patch: { ...code, html: replaceRange(code.html, hit.start, hit.end, label + tag) },
    summary: `Adds a label "${text}" and connects it to the field.`,
  };
};

const headingOrder: Rule = (f, code) => {
  if (!f.from || !f.to) return null;
  // Renaming the tag would orphan any CSS or JavaScript that selects it by name, so leave that to the model.
  const byName = new RegExp(`(^|[^\\w-])h${f.to}(?![\\w-])`);
  if (byName.test(code.css) || byName.test(code.js)) return null;
  const hit = findTag(code.html, f);
  if (!hit) return null;
  const level = f.from + 1;
  const close = new RegExp(`</h${f.to}\\s*>`, "i").exec(code.html.slice(hit.end));
  if (!close) return null;
  const closeStart = hit.end + close.index;
  let html = replaceRange(code.html, closeStart, closeStart + close[0].length, `</h${level}>`);
  html = replaceRange(html, hit.start, hit.end, hit.text.replace(new RegExp(`^<h${f.to}`, "i"), `<h${level}`));
  return { patch: { ...code, html }, summary: `Changes this h${f.to} to an h${level} so heading levels do not skip.` };
};

const tabindex: Rule = (f, code) => {
  const hit = findTag(code.html, f);
  if (!hit) return null;
  return {
    patch: { ...code, html: replaceRange(code.html, hit.start, hit.end, setAttr(hit.text, "tabindex", "0")) },
    summary: 'Sets tabindex to 0, so the element keeps its place in the natural tab order.',
  };
};

const imgAlt: Rule = (f, code) => {
  const hit = findTag(code.html, f);
  if (!hit || getAttr(hit.text, "alt") !== null) return null;
  return {
    patch: { ...code, html: replaceRange(code.html, hit.start, hit.end, setAttr(hit.text, "alt", "")) },
    summary: 'Marks the image as decoration (alt=""). If it carries meaning, describe it instead.',
  };
};

const duplicateId: Rule = (f, code) => {
  const id = f.id;
  if (!id) return null;
  const withId = allTags(code.html, f.tag).filter((t) => getAttr(t.text, "id") === id);
  if (withId.length < 2) return null;
  // Renaming is only safe when nothing refers to the id: not CSS, JavaScript, a label, a link or aria.
  const idAttrs = [...code.html.matchAll(new RegExp(`\\sid\\s*=\\s*["']${id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "gi"))].length;
  const mentions = code.html.split(id).length - 1;
  if (mentions > idAttrs || code.css.includes(id) || code.js.includes(id)) return null;
  const target = withId[withId.length - 1];
  const next = uniqueId(code.html, `${id}-2`);
  return {
    patch: { ...code, html: replaceRange(code.html, target.start, target.end, setAttr(target.text, "id", next)) },
    summary: `Renames the later duplicate to "${next}". Nothing in the page refers to "${id}".`,
  };
};

/** Rules whose selector's last compound matches the element: .class, #id, tag, or tag.class. */
function* cssRules(css: string) {
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) return;
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const selector = css.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const body = css.slice(open + 1, depth === 0 ? j - 1 : j);
    i = j;
    if (depth !== 0 || selector.startsWith("@") || body.includes("{")) continue;
    yield { selector, bodyStart: open + 1, body };
  }
}

/** A `color:` declaration, not `background-color:`, with its value and no trailing space. */
const COLOR_DECL = /(?<![-\w])color\s*:\s*([^;}"']*?)\s*(?=[;}"']|$)/i;

/** The last compound of a selector: `.card > p.note` gives `p.note`. */
const lastCompound = (selector: string) => selector.trim().split(/[\s>+~]+/).pop() ?? "";

const colorContrast: Rule = (f, code) => {
  if (!f.fg || !f.bg || !f.need) return null;
  const color = passingColor(f.fg, f.bg, f.need);
  if (!color) return null;
  const hex = toHex(color);
  const summary = `Changes the text colour to ${hex}, which reaches ${f.need}:1 on this background.`;
  const hit = findTag(code.html, f);
  if (!hit) return null;

  const inline = getAttr(hit.text, "style");
  if (inline && COLOR_DECL.test(inline) && !/var\(/.test(inline)) {
    const style = inline.replace(COLOR_DECL, `color: ${hex}`);
    return { patch: { ...code, html: replaceRange(code.html, hit.start, hit.end, setAttr(hit.text, "style", style)) }, summary };
  }

  const classes = (getAttr(hit.text, "class") ?? "").split(/\s+/).filter(Boolean);
  const id = getAttr(hit.text, "id");
  // Most specific first. Selectors with a pseudo-class (:hover) never match, so those rules are left alone.
  const wanted = [...(id ? [`#${id}`] : []), ...classes.flatMap((c) => [`.${c}`, `${f.tag}.${c}`]), f.tag];
  for (const want of wanted) {
    for (const rule of cssRules(code.css)) {
      const matches = rule.selector.split(",").some((s) => lastCompound(s) === want);
      const decl = COLOR_DECL.exec(rule.body);
      if (!matches || !decl || /var\(/.test(decl[1])) continue;
      const at = rule.bodyStart + decl.index;
      return { patch: { ...code, css: replaceRange(code.css, at, at + decl[0].length, `color: ${hex}`) }, summary };
    }
  }
  return null;
};

const rules: Partial<Record<A11yFinding["rule"], Rule>> = {
  "form-label": formLabel,
  "heading-order": headingOrder,
  "tabindex-positive": tabindex,
  "img-alt": imgAlt,
  "duplicate-id": duplicateId,
  "color-contrast": colorContrast,
};

export const rulesEngine = {
  id: "rules" as const,
  // A rule either has a fix or it does not, so unlike a model this never returns a Rejection.
  async propose(problem: Problem, code: Patch, previous: Attempt | null): Promise<Proposal | null> {
    // One mechanical answer per problem: a second try would give the same patch.
    if (previous || problem.type !== "a11y") return null;
    try {
      return rules[problem.finding.rule]?.(problem.finding, code) ?? null;
    } catch {
      return null;
    }
  },
} satisfies FixEngine;
