export type DiffLine = { type: "same" | "add" | "del"; text: string; oldNo: number | null; newNo: number | null };

const split = (s: string) => (s === "" ? [] : s.split("\n"));

/** Above this many cells the quadratic table is skipped and the changed middle is shown as one replace. */
const MAX_CELLS = 4_000_000;

/** Line diff of two texts (longest common subsequence). `del` lines come from `a`, `add` lines from `b`. */
export function lineDiff(a: string, b: string): DiffLine[] {
  const x = split(a);
  const y = split(b);

  let start = 0;
  while (start < x.length && start < y.length && x[start] === y[start]) start++;
  let endX = x.length;
  let endY = y.length;
  while (endX > start && endY > start && x[endX - 1] === y[endY - 1]) { endX--; endY--; }

  const out: DiffLine[] = [];
  let oldNo = 1;
  let newNo = 1;
  const push = (type: DiffLine["type"], text: string) => {
    out.push({ type, text, oldNo: type === "add" ? null : oldNo, newNo: type === "del" ? null : newNo });
    if (type !== "add") oldNo++;
    if (type !== "del") newNo++;
  };

  for (let i = 0; i < start; i++) push("same", x[i]);

  const m = endX - start;
  const n = endY - start;
  if (m * n > MAX_CELLS) {
    for (let i = start; i < endX; i++) push("del", x[i]);
    for (let j = start; j < endY; j++) push("add", y[j]);
  } else {
    // lcs[i][j] = length of the common subsequence of x[start+i..] and y[start+j..]
    const lcs: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
    for (let i = m - 1; i >= 0; i--) {
      for (let j = n - 1; j >= 0; j--) {
        lcs[i][j] = x[start + i] === y[start + j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < m && j < n) {
      if (x[start + i] === y[start + j]) { push("same", x[start + i]); i++; j++; }
      else if (lcs[i + 1][j] >= lcs[i][j + 1]) { push("del", x[start + i]); i++; }
      else { push("add", y[start + j]); j++; }
    }
    for (; i < m; i++) push("del", x[start + i]);
    for (; j < n; j++) push("add", y[start + j]);
  }

  for (let i = endX; i < x.length; i++) push("same", x[i]);
  return out;
}

export function diffStats(lines: DiffLine[]) {
  let added = 0;
  let removed = 0;
  for (const l of lines) {
    if (l.type === "add") added++;
    else if (l.type === "del") removed++;
  }
  return { added, removed, changed: added + removed > 0 };
}

/** Collapses long unchanged runs, keeping `context` lines around every change. `null` marks a collapsed gap. */
export function withContext(lines: DiffLine[], context = 3): (DiffLine | { gap: number })[] {
  const keep = new Array<boolean>(lines.length).fill(false);
  lines.forEach((l, i) => {
    if (l.type === "same") return;
    for (let k = Math.max(0, i - context); k <= Math.min(lines.length - 1, i + context); k++) keep[k] = true;
  });
  const out: (DiffLine | { gap: number })[] = [];
  let gap = 0;
  lines.forEach((l, i) => {
    if (keep[i]) {
      if (gap) { out.push({ gap }); gap = 0; }
      out.push(l);
    } else gap++;
  });
  if (gap) out.push({ gap });
  return out;
}
