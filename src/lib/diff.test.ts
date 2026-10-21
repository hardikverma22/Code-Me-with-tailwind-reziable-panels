import { diffStats, lineDiff, withContext } from "./diff";

const apply = (lines: ReturnType<typeof lineDiff>, side: "old" | "new") =>
  lines.filter((l) => (side === "old" ? l.type !== "add" : l.type !== "del")).map((l) => l.text).join("\n");

describe("lineDiff", () => {
  it("reports no change for identical text", () => {
    const d = lineDiff("a\nb", "a\nb");
    expect(diffStats(d).changed).toBe(false);
    expect(d.every((l) => l.type === "same")).toBe(true);
  });

  it("finds an added, a removed and a changed line", () => {
    const d = lineDiff("a\nb\nc", "a\nB\nc\nd");
    expect(diffStats(d)).toEqual({ added: 2, removed: 1, changed: true });
    expect(d.filter((l) => l.type === "del").map((l) => l.text)).toEqual(["b"]);
    expect(d.filter((l) => l.type === "add").map((l) => l.text)).toEqual(["B", "d"]);
  });

  it("round-trips: old side and new side rebuild the inputs", () => {
    const a = "one\ntwo\nthree\nfour\nfive";
    const b = "one\n2\nthree\nfive\nsix";
    const d = lineDiff(a, b);
    expect(apply(d, "old")).toBe(a);
    expect(apply(d, "new")).toBe(b);
  });

  it("numbers lines on each side", () => {
    const d = lineDiff("a\nb", "a\nx\nb");
    expect(d.find((l) => l.type === "add")).toMatchObject({ text: "x", oldNo: null, newNo: 2 });
    expect(d[d.length - 1]).toMatchObject({ text: "b", oldNo: 2, newNo: 3 });
  });

  it("handles empty sides", () => {
    expect(diffStats(lineDiff("", "a\nb"))).toEqual({ added: 2, removed: 0, changed: true });
    expect(diffStats(lineDiff("a\nb", ""))).toEqual({ added: 0, removed: 2, changed: true });
    expect(lineDiff("", "")).toEqual([]);
  });

  it("falls back to a replace for huge inputs instead of building a giant table", () => {
    const a = Array.from({ length: 3000 }, (_, i) => `a${i}`).join("\n");
    const b = Array.from({ length: 3000 }, (_, i) => `b${i}`).join("\n");
    const s = diffStats(lineDiff(a, b));
    expect(s).toEqual({ added: 3000, removed: 3000, changed: true });
  });
});

describe("withContext", () => {
  it("collapses unchanged runs far from a change", () => {
    const a = Array.from({ length: 20 }, (_, i) => `l${i}`).join("\n");
    const b = a.replace("l10", "changed");
    const rows = withContext(lineDiff(a, b), 2);
    expect(rows.some((r) => "gap" in r)).toBe(true);
    expect(rows.filter((r) => !("gap" in r)).length).toBeLessThan(20);
  });
});
