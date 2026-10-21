import type { A11yFinding } from "../a11y";

export type TagHit = { start: number; end: number; text: string };

/** Opening tags of one kind, with quoted attribute values that may contain `>`. */
const openTags = (tag: string) => new RegExp(`<${tag}(?=[\\s/>])(?:"[^"]*"|'[^']*'|[^'">])*>`, "gi");

export function allTags(html: string, tag: string): TagHit[] {
  return [...html.matchAll(openTags(tag))].map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0] }));
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The opening tag in the HTML tab that a finding is about. Found by id, or by position among tags of
 * that kind, but only when the source has as many as the rendered page: scripts can add elements,
 * and then the position would point at the wrong one.
 */
export function findTag(html: string, f: Pick<A11yFinding, "tag" | "id" | "tagIndex" | "tagCount">): TagHit | null {
  const tags = allTags(html, f.tag);
  if (f.id) {
    const re = new RegExp(`\\sid\\s*=\\s*["']${esc(f.id)}["']`, "i");
    const byId = tags.find((t) => re.test(t.text));
    if (byId) return byId;
  }
  if (tags.length !== f.tagCount || f.tagIndex < 0 || f.tagIndex >= tags.length) return null;
  return tags[f.tagIndex];
}

/** An attribute's value in an opening tag, or null when it is absent. A bare attribute is "". */
export function getAttr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${esc(name)}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+)))?(?=[\\s/>])`, "i").exec(tag);
  if (!m) return null;
  return m[1] ?? m[2] ?? m[3] ?? "";
}

/** Sets an attribute in an opening tag, replacing it if present. */
export function setAttr(tag: string, name: string, value: string): string {
  const quoted = `${name}="${value.replace(/"/g, "&quot;")}"`;
  const re = new RegExp(`(\\s)${esc(name)}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?(?=[\\s/>])`, "i");
  if (re.test(tag)) return tag.replace(re, `$1${quoted}`);
  return tag.replace(/\s*(\/?)>$/, (_, slash: string) => ` ${quoted}${slash ? " /" : ""}>`);
}

export const replaceRange = (text: string, start: number, end: number, insert: string) => text.slice(0, start) + insert + text.slice(end);

/** The whitespace at the start of the line that contains `index`. */
export const indentAt = (text: string, index: number) => /^[ \t]*/.exec(text.slice(text.lastIndexOf("\n", index - 1) + 1))![0];
