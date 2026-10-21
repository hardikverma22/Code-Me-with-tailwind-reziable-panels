import { withContext, type DiffLine } from "../lib/diff";

/** A unified diff: added lines in aqua, removed in red, long unchanged runs collapsed. */
export default function DiffRows({ lines, label }: { lines: DiffLine[]; label: string }) {
  const rows = withContext(lines);
  return (
    <pre className="overflow-auto rounded-lg bg-bench py-2 font-mono text-xs leading-5" aria-label={label}>
      {rows.map((r, i) =>
        "gap" in r ? (
          <div key={`g${i}`} className="px-4 text-fade/70">⋯ {r.gap} unchanged {r.gap === 1 ? "line" : "lines"}</div>
        ) : (
          <div key={i} className={`flex whitespace-pre-wrap px-2 ${r.type === "add" ? "bg-css/15 text-paper" : r.type === "del" ? "bg-danger/15 text-paper" : "text-fade"}`}>
            <span className="tnum w-8 shrink-0 select-none pr-2 text-right text-fade/60">{r.newNo ?? r.oldNo}</span>
            <span aria-hidden className={`w-4 shrink-0 select-none ${r.type === "add" ? "text-css" : r.type === "del" ? "text-danger" : ""}`}>{r.type === "add" ? "+" : r.type === "del" ? "−" : " "}</span>
            <span className="min-w-0 break-words">
              {r.type !== "same" && <span className="sr-only">{r.type === "add" ? "added: " : "removed: "}</span>}
              {r.text || " "}
            </span>
          </div>
        )
      )}
    </pre>
  );
}
