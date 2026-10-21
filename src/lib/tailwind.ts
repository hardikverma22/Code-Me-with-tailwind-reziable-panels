/**
 * Tailwind helpers for the editor: class-name suggestions and a CSS to utility-class converter.
 * Both cover the common utilities, not all of Tailwind. Anything the converter does not
 * recognise is kept as plain CSS, so converting never loses a declaration.
 */

const SPACING = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96];
const COLORS = ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"];
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const SIZES = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl"];
const ROUNDS = ["none", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "full"];
const FRACTIONS = ["1/2", "1/3", "2/3", "1/4", "3/4", "1/5", "2/5", "3/5", "4/5", "1/6", "5/6"];

export const VARIANTS = ["hover", "focus", "focus-visible", "active", "disabled", "first", "last", "odd", "even", "group-hover", "dark", "sm", "md", "lg", "xl", "2xl", "motion-reduce", "print"];

const build = (): string[] => {
  const out = new Set<string>();
  const add = (...names: string[]) => names.forEach((n) => out.add(n));

  add("block", "inline", "inline-block", "flex", "inline-flex", "grid", "inline-grid", "hidden", "contents", "table");
  add("static", "relative", "absolute", "fixed", "sticky", "inset-0", "top-0", "right-0", "bottom-0", "left-0");
  add("flex-row", "flex-col", "flex-wrap", "flex-nowrap", "flex-1", "flex-auto", "flex-none", "grow", "shrink-0");
  add("items-start", "items-center", "items-end", "items-stretch", "items-baseline");
  add("justify-start", "justify-center", "justify-end", "justify-between", "justify-around", "justify-evenly");
  add("self-auto", "self-start", "self-center", "self-end", "place-items-center", "place-content-center");
  add("overflow-hidden", "overflow-auto", "overflow-scroll", "overflow-x-auto", "overflow-y-auto", "truncate");
  add("container", "mx-auto", "w-full", "h-full", "w-screen", "h-screen", "min-h-screen", "min-w-0", "max-w-full", "w-auto", "h-auto");
  add("font-thin", "font-light", "font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold", "font-black");
  add("font-sans", "font-serif", "font-mono", "italic", "not-italic", "uppercase", "lowercase", "capitalize");
  add("underline", "no-underline", "line-through", "text-left", "text-center", "text-right", "text-justify");
  add("leading-none", "leading-tight", "leading-snug", "leading-normal", "leading-relaxed", "leading-loose");
  add("tracking-tight", "tracking-normal", "tracking-wide", "whitespace-nowrap", "break-words");
  add("border", "border-0", "border-2", "border-4", "border-t", "border-b", "border-l", "border-r", "border-solid", "border-dashed", "border-transparent");
  add("shadow-sm", "shadow", "shadow-md", "shadow-lg", "shadow-xl", "shadow-2xl", "shadow-none");
  add("cursor-pointer", "cursor-not-allowed", "select-none", "pointer-events-none", "sr-only", "outline-none");
  add("transition", "transition-colors", "transition-all", "transition-transform", "duration-150", "duration-200", "duration-300", "ease-in-out", "ease-out");
  add("transform", "scale-95", "scale-100", "scale-105", "rotate-45", "rotate-90", "-rotate-45", "translate-x-1/2", "-translate-x-1/2", "-translate-y-1/2");
  add("animate-spin", "animate-pulse", "animate-bounce", "bg-transparent", "bg-white", "bg-black", "text-white", "text-black", "text-transparent", "border-white", "border-black");
  add("bg-cover", "bg-center", "bg-no-repeat", "object-cover", "object-contain", "object-center", "aspect-square", "aspect-video");
  add("grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4", "grid-cols-6", "grid-cols-12", "col-span-2", "col-span-full", "row-span-2");
  add("opacity-0", "opacity-25", "opacity-50", "opacity-75", "opacity-100", "z-0", "z-10", "z-20", "z-30", "z-40", "z-50");
  add("backdrop-blur", "backdrop-blur-sm", "backdrop-blur-md", "blur", "blur-sm", "blur-md", "ring", "ring-2", "ring-offset-2", "list-none", "list-disc");

  for (const s of SIZES) add(`text-${s}`);
  for (const r of ROUNDS) add(`rounded-${r}`, `rounded-t-${r}`, `rounded-b-${r}`);
  add("rounded");
  for (const n of SPACING) {
    for (const p of ["p", "px", "py", "pt", "pr", "pb", "pl", "m", "mx", "my", "mt", "mr", "mb", "ml", "gap", "gap-x", "gap-y", "space-x", "space-y", "w", "h", "size", "min-w", "min-h", "top", "right", "bottom", "left", "inset"]) {
      if (n === 0 && p !== "gap" && !p.startsWith("p") && !p.startsWith("m") && p !== "w" && p !== "h" && p !== "size") continue;
      add(`${p}-${n}`);
    }
  }
  for (const f of FRACTIONS) add(`w-${f}`, `h-${f}`);
  for (const w of ["xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "prose"]) add(`max-w-${w}`);
  for (const c of COLORS) {
    for (const s of SHADES) add(`bg-${c}-${s}`, `text-${c}-${s}`, `border-${c}-${s}`, `ring-${c}-${s}`, `from-${c}-${s}`, `to-${c}-${s}`);
  }
  add("bg-gradient-to-r", "bg-gradient-to-b", "bg-gradient-to-br", "bg-linear-to-r", "bg-linear-to-b", "bg-linear-to-br");
  return [...out].sort();
};

let cache: string[] | undefined;
export const tailwindClasses = () => (cache ??= build());

/**
 * Suggestions for the word being typed inside a class attribute. Handles variant prefixes
 * (`hover:bg-`): the typed variants are kept, only the utility after the last colon is completed.
 * Returns the number of characters to keep before the suggestion starts.
 */
export function classOptions(token: string, limit = 80): { keep: number; options: string[] } {
  const colon = token.lastIndexOf(":");
  const keep = colon + 1;
  const word = token.slice(keep);
  const options: string[] = [];
  if (word.length > 0 || colon >= 0) {
    for (const c of tailwindClasses()) {
      if (c.startsWith(word)) options.push(c);
      if (options.length >= limit) break;
    }
  }
  if (colon < 0 && word.length > 0) {
    for (const v of VARIANTS) if (v.startsWith(word) && options.length < limit) options.push(`${v}:`);
  }
  return { keep, options };
}

/** The class-attribute value surrounding `pos` in `text`, or null when `pos` is not inside one. */
export function classTokenAt(text: string, pos: number): { from: number; token: string } | null {
  const before = text.slice(0, pos);
  const open = /\bclass(?:Name)?\s*=\s*(["'])((?:(?!\1)[^<>])*)$/i.exec(before);
  if (!open) return null;
  const value = open[2];
  const wordStart = value.search(/[^\s"']*$/);
  const token = value.slice(wordStart);
  return { from: pos - token.length, token };
}

// ---------- CSS to Tailwind ----------

const unitless = (n: number) => String(Math.round(n * 1000) / 1000);

/** `16px`, `1rem`, `0`, `50%`, `100%`, `auto` as a number of spacing units (4px each), or null. */
function spaceUnits(value: string): number | null {
  const v = value.trim();
  if (v === "0") return 0;
  const m = /^(-?\d*\.?\d+)(px|rem)$/.exec(v);
  if (!m) return null;
  const px = m[2] === "rem" ? Number(m[1]) * 16 : Number(m[1]);
  const units = px / 4;
  return SPACING.includes(Math.abs(units)) || units === 0 ? units : null;
}

const arbitrary = (v: string) => `[${v.trim().replace(/\s+/g, "_")}]`;
const isLength = (v: string) => /^-?\d*\.?\d+(px|rem|em|%|vh|vw|ch)$/.test(v.trim()) || v.trim() === "0";

function sized(prefix: string, value: string): string | null {
  const v = value.trim();
  if (v === "auto") return `${prefix}-auto`;
  if (v === "100%") return `${prefix}-full`;
  if (v === "100vh" && (prefix === "h" || prefix === "min-h")) return prefix === "h" ? "h-screen" : "min-h-screen";
  if (v === "100vw" && prefix === "w") return "w-screen";
  const u = spaceUnits(v);
  if (u !== null && u >= 0) return `${prefix}-${unitless(u)}`;
  return isLength(v) ? `${prefix}-${arbitrary(v)}` : null;
}

function spacing(prefix: string, value: string): string | null {
  const v = value.trim();
  const neg = v.startsWith("-");
  if (v === "auto") return prefix.startsWith("m") ? `${prefix}-auto` : null;
  const u = spaceUnits(neg ? v.slice(1) : v);
  if (u !== null) return `${neg ? "-" : ""}${prefix}-${unitless(u)}`;
  return isLength(v) ? `${neg ? "-" : ""}${prefix}-${arbitrary(neg ? v.slice(1) : v)}` : null;
}

/** padding / margin shorthand with 1 to 4 values to utilities. */
function boxShorthand(kind: "p" | "m", value: string): string[] | null {
  const parts = value.trim().split(/\s+/);
  if (parts.length < 1 || parts.length > 4) return null;
  const [a, b = a, c = a, d = b] = parts;
  const sides: [string, string][] =
    parts.length === 1 ? [[kind, a]]
    : parts.length === 2 ? [[`${kind}y`, a], [`${kind}x`, b]]
    : parts.length === 3 ? [[`${kind}t`, a], [`${kind}x`, b], [`${kind}b`, c]]
    : [[`${kind}t`, a], [`${kind}r`, b], [`${kind}b`, c], [`${kind}l`, d]];
  const out: string[] = [];
  for (const [p, v] of sides) {
    const cls = spacing(p, v);
    if (!cls) return null;
    out.push(cls);
  }
  return out;
}

const FONT_SIZES: Record<string, string> = { "12px": "xs", "14px": "sm", "16px": "base", "18px": "lg", "20px": "xl", "24px": "2xl", "30px": "3xl", "36px": "4xl", "48px": "5xl", "60px": "6xl", "72px": "7xl", "96px": "8xl", "128px": "9xl" };
const WEIGHTS: Record<string, string> = { "100": "thin", "200": "extralight", "300": "light", "400": "normal", "500": "medium", "600": "semibold", "700": "bold", "800": "extrabold", "900": "black", bold: "bold", normal: "normal" };
const RADII: Record<string, string> = { "0": "none", "2px": "xs", "4px": "sm", "6px": "md", "8px": "lg", "12px": "xl", "16px": "2xl", "24px": "3xl", "9999px": "full", "50%": "full" };

const color = (prefix: string, value: string): string | null => {
  const v = value.trim().toLowerCase();
  if (v === "white" || v === "black" || v === "transparent") return `${prefix}-${v}`;
  if (v === "currentcolor") return `${prefix}-current`;
  if (/^#([0-9a-f]{3,8})$/.test(v) || /^(rgb|hsl)a?\([\d\s.,%/-]+\)$/.test(v)) return `${prefix}-${arbitrary(v)}`;
  return null;
};

const KEYWORD: Record<string, Record<string, string>> = {
  display: { block: "block", inline: "inline", "inline-block": "inline-block", flex: "flex", "inline-flex": "inline-flex", grid: "grid", "inline-grid": "inline-grid", none: "hidden", contents: "contents" },
  position: { static: "static", relative: "relative", absolute: "absolute", fixed: "fixed", sticky: "sticky" },
  "flex-direction": { row: "flex-row", column: "flex-col", "row-reverse": "flex-row-reverse", "column-reverse": "flex-col-reverse" },
  "flex-wrap": { wrap: "flex-wrap", nowrap: "flex-nowrap" },
  "align-items": { center: "items-center", "flex-start": "items-start", start: "items-start", "flex-end": "items-end", end: "items-end", stretch: "items-stretch", baseline: "items-baseline" },
  "justify-content": { center: "justify-center", "flex-start": "justify-start", start: "justify-start", "flex-end": "justify-end", end: "justify-end", "space-between": "justify-between", "space-around": "justify-around", "space-evenly": "justify-evenly" },
  "text-align": { left: "text-left", center: "text-center", right: "text-right", justify: "text-justify" },
  "font-style": { italic: "italic", normal: "not-italic" },
  "text-transform": { uppercase: "uppercase", lowercase: "lowercase", capitalize: "capitalize", none: "normal-case" },
  "text-decoration": { none: "no-underline", underline: "underline", "line-through": "line-through" },
  "text-decoration-line": { none: "no-underline", underline: "underline", "line-through": "line-through" },
  cursor: { pointer: "cursor-pointer", default: "cursor-default", "not-allowed": "cursor-not-allowed", text: "cursor-text" },
  overflow: { hidden: "overflow-hidden", auto: "overflow-auto", scroll: "overflow-scroll", visible: "overflow-visible" },
  "overflow-x": { hidden: "overflow-x-hidden", auto: "overflow-x-auto", scroll: "overflow-x-scroll" },
  "overflow-y": { hidden: "overflow-y-hidden", auto: "overflow-y-auto", scroll: "overflow-y-scroll" },
  "white-space": { nowrap: "whitespace-nowrap", normal: "whitespace-normal", pre: "whitespace-pre", "pre-wrap": "whitespace-pre-wrap" },
  "pointer-events": { none: "pointer-events-none", auto: "pointer-events-auto" },
  "user-select": { none: "select-none", text: "select-text", all: "select-all" },
  "object-fit": { cover: "object-cover", contain: "object-contain", fill: "object-fill" },
  "box-sizing": { "border-box": "box-border", "content-box": "box-content" },
  "list-style": { none: "list-none" },
  "list-style-type": { none: "list-none", disc: "list-disc", decimal: "list-decimal" },
  "border-style": { solid: "border-solid", dashed: "border-dashed", dotted: "border-dotted" },
};

/** One declaration to the utility classes that produce it, or null when unsupported. */
export function declarationToClasses(prop: string, rawValue: string): string[] | null {
  const value = rawValue.trim();
  if (!value || /!important|var\(|calc\(|env\(|clamp\(|min\(|max\(|;/.test(value)) return null;
  const p = prop.trim().toLowerCase();

  const kw = KEYWORD[p]?.[value.toLowerCase()];
  if (kw) return [kw];

  const single = (cls: string | null) => (cls ? [cls] : null);
  switch (p) {
    case "padding": return boxShorthand("p", value);
    case "margin": return boxShorthand("m", value);
    case "padding-top": return single(spacing("pt", value));
    case "padding-right": return single(spacing("pr", value));
    case "padding-bottom": return single(spacing("pb", value));
    case "padding-left": return single(spacing("pl", value));
    case "margin-top": return single(spacing("mt", value));
    case "margin-right": return single(spacing("mr", value));
    case "margin-bottom": return single(spacing("mb", value));
    case "margin-left": return single(spacing("ml", value));
    case "gap": {
      const parts = value.split(/\s+/);
      if (parts.length === 1) return single(spacing("gap", value));
      if (parts.length === 2) { const y = spacing("gap-y", parts[0]); const x = spacing("gap-x", parts[1]); return y && x ? [y, x] : null; }
      return null;
    }
    case "row-gap": return single(spacing("gap-y", value));
    case "column-gap": return single(spacing("gap-x", value));
    case "width": return single(sized("w", value));
    case "height": return single(sized("h", value));
    case "min-width": return single(sized("min-w", value));
    case "min-height": return single(sized("min-h", value));
    case "max-width": return single(value === "none" ? "max-w-none" : sized("max-w", value));
    case "max-height": return single(sized("max-h", value));
    case "top": return single(spacing("top", value));
    case "right": return single(spacing("right", value));
    case "bottom": return single(spacing("bottom", value));
    case "left": return single(spacing("left", value));
    case "z-index": return /^-?\d+$/.test(value) ? [`${value.startsWith("-") ? "-" : ""}z-${value.replace("-", "")}`] : null;
    case "opacity": {
      const n = Number(value);
      return Number.isFinite(n) && n >= 0 && n <= 1 ? [`opacity-${Math.round(n * 100)}`] : null;
    }
    case "flex": return value === "1" || value === "1 1 0%" ? ["flex-1"] : value === "none" ? ["flex-none"] : value === "auto" ? ["flex-auto"] : null;
    case "flex-grow": return value === "1" ? ["grow"] : value === "0" ? ["grow-0"] : null;
    case "flex-shrink": return value === "0" ? ["shrink-0"] : value === "1" ? ["shrink"] : null;
    case "font-size": return single(FONT_SIZES[value] ? `text-${FONT_SIZES[value]}` : isLength(value) ? `text-${arbitrary(value)}` : null);
    case "font-weight": return single(WEIGHTS[value] ? `font-${WEIGHTS[value]}` : null);
    case "line-height": return /^\d*\.?\d+$/.test(value) ? [`leading-${arbitrary(value)}`] : isLength(value) ? [`leading-${arbitrary(value)}`] : null;
    case "letter-spacing": return isLength(value) ? [`tracking-${arbitrary(value)}`] : null;
    case "color": return single(color("text", value));
    case "background-color": return single(color("bg", value));
    case "background": return single(color("bg", value));
    case "border-color": return single(color("border", value));
    case "border-radius": return single(RADII[value] ? (RADII[value] === "none" ? "rounded-none" : `rounded-${RADII[value]}`) : isLength(value) && !value.includes(" ") ? `rounded-${arbitrary(value)}` : null);
    case "border-width": return value === "1px" ? ["border"] : /^\d+px$/.test(value) ? [`border-${parseInt(value, 10)}`] : value === "0" ? ["border-0"] : null;
    case "border": {
      if (value === "none" || value === "0") return ["border-0"];
      const m = /^(\d+)px\s+(solid|dashed|dotted)\s+(.+)$/i.exec(value);
      if (!m) return null;
      const c = color("border", m[3]);
      if (!c) return null;
      return [m[1] === "1" ? "border" : `border-${m[1]}`, `border-${m[2].toLowerCase()}`, c];
    }
    default: return null;
  }
}

export type ConvertResult = { css: string; converted: number; kept: number };

function convertBody(body: string): { classes: string[]; rest: string[]; converted: number } {
  const classes: string[] = [];
  const rest: string[] = [];
  let converted = 0;
  for (const raw of body.split(";")) {
    const decl = raw.trim();
    if (!decl) continue;
    const colon = decl.indexOf(":");
    if (colon < 0) { rest.push(decl); continue; }
    const cls = declarationToClasses(decl.slice(0, colon), decl.slice(colon + 1));
    if (cls) { for (const c of cls) if (!classes.includes(c)) classes.push(c); converted++; }
    else rest.push(decl);
  }
  return { classes, rest, converted };
}

/**
 * Rewrites plain rules into `@apply` rules. At-rules (`@media`, `@keyframes`, ...), comments and
 * rules that already use `@apply` are left untouched; declarations that have no utility stay as CSS.
 */
export function cssToTailwind(css: string): ConvertResult {
  let out = "";
  let converted = 0;
  let kept = 0;
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) { out += css.slice(i); break; }
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === "{") depth++;
      else if (css[j] === "}") depth--;
      j++;
    }
    const head = css.slice(i, open);
    const block = css.slice(open, j);
    const body = css.slice(open + 1, depth === 0 ? j - 1 : j);
    const lead = /^(?:\s|\/\*[\s\S]*?\*\/)*/.exec(head)![0];
    const selector = head.slice(lead.length).trim();
    i = j;

    const plain = depth === 0 && selector !== "" && !selector.startsWith("@") && !body.includes("{") && !body.includes("/*") && !body.includes("@apply");
    if (!plain) { out += head + block; continue; }

    const { classes, rest, converted: n } = convertBody(body);
    if (classes.length === 0) { out += head + block; continue; }
    converted += n;
    kept += rest.length;
    out += `${lead}${selector} {\n${[`  @apply ${classes.join(" ")};`, ...rest.map((d) => `  ${d};`)].join("\n")}\n}`;
  }
  return { css: out, converted, kept };
}
