export type Tok = { t: string; c: string };

const rules: Record<"html" | "css" | "js", [RegExp, string][]> = {
  html: [
    [/<\/?[a-z][a-z0-9]*/i, "text-html"],
    [/"[^"]*"/, "text-css"],
    [/[a-z-]+(?==)/i, "text-lemon"],
    [/\/?>/, "text-html"],
  ],
  css: [
    [/\/\*[\s\S]*?\*\//, "text-fade"],
    [/#[0-9a-f]{3,8}\b|-?\d+(\.\d+)?(px|rem|%|s|ms)?\b/i, "text-js"],
    [/[.#]?[a-z][\w-]*(?=\s*[{,])/i, "text-html"],
    [/[a-z-]+(?=\s*:)/i, "text-lemon"],
  ],
  js: [
    [/"[^"]*"|'[^']*'|`[^`]*`/, "text-css"],
    [/\b(const|let|var|function|return|if|else|for|while|new|true|false|null)\b/, "text-html"],
    [/\b\d+(\.\d+)?\b/, "text-js"],
    [/[A-Za-z_$][\w$]*(?=\()/, "text-js"],
  ],
};

/** A tiny tokenizer, good enough to colour short demo snippets. */
export function tokenize(code: string, lang: "html" | "css" | "js"): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  let plain = "";
  const flush = () => { if (plain) { out.push({ t: plain, c: "text-paper" }); plain = ""; } };
  while (i < code.length) {
    let hit: { len: number; c: string } | null = null;
    for (const [re, c] of rules[lang]) {
      const m = new RegExp(re.source, re.flags.replace("g", "") + "y");
      m.lastIndex = i;
      const r = m.exec(code);
      if (r && r[0].length) { hit = { len: r[0].length, c }; break; }
    }
    if (hit) { flush(); out.push({ t: code.slice(i, i + hit.len), c: hit.c }); i += hit.len; }
    else { plain += code[i]; i++; }
  }
  flush();
  return out;
}
