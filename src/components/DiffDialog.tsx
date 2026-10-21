import { useEffect, useMemo, useState } from "react";
import { convex } from "../lib/convex";
import { api } from "../../convex/_generated/api";
import { useProject } from "../store/project";
import { diffStats, lineDiff, withContext } from "../lib/diff";
import type { Language } from "../lib/format";
import Modal from "./Modal";

const tabs: { id: Language; name: string }[] = [{ id: "html", name: "HTML" }, { id: "css", name: "CSS" }, { id: "js", name: "JavaScript" }];

type Base = { slug: string; html: string; css: string; js: string };
type Load = { state: "loading" } | { state: "error" } | { state: "ready"; base: Base };
/** What a fetch for `slug` returned: the snapshot, or null when it is missing or the request failed. */
type Fetched = { slug: string; base: Base | null };

/** Line-by-line changes between what is in the editor and an earlier shared snapshot. */
export default function DiffDialog({ onClose }: { onClose: () => void }) {
  const parentSlug = useProject((s) => s.parentSlug);
  const forkedFrom = useProject((s) => s.forkedFrom);
  const current = useProject();
  // Compare against the link this work was opened from, or against the project that link was forked from.
  const choices = [parentSlug, forkedFrom].filter((s): s is string => Boolean(s));
  const [slug, setSlug] = useState(choices[0]);
  const [tab, setTab] = useState<Language>("html");
  const [fetched, setFetched] = useState<Fetched | null>(null);

  useEffect(() => {
    if (!slug || !convex) return;
    let live = true;
    convex
      .query(api.projects.getBySlug, { slug })
      .then((p) => { if (live) setFetched({ slug, base: p }); })
      .catch(() => { if (live) setFetched({ slug, base: null }); });
    return () => { live = false; };
  }, [slug]);

  // Loading is whatever has not answered for the slug being shown, so switching base needs no reset.
  const answered = fetched?.slug === slug;
  const base = answered ? fetched.base : null;
  const load: Load = !answered ? { state: "loading" } : base ? { state: "ready", base } : { state: "error" };

  const diffs = useMemo(() => {
    if (!base) return null;
    return Object.fromEntries(tabs.map((t) => [t.id, lineDiff(base[t.id], current[t.id])])) as Record<Language, ReturnType<typeof lineDiff>>;
  }, [base, current]);

  const stat = (l: Language) => (diffs ? diffStats(diffs[l]) : null);
  const total = diffs ? tabs.reduce((n, t) => n + diffStats(diffs[t.id]).added + diffStats(diffs[t.id]).removed, 0) : 0;
  const rows = diffs ? withContext(diffs[tab]) : [];

  return (
    <Modal title="Changes" onClose={onClose} wide>
      {choices.length > 1 && (
        <div className="mb-3 flex items-center gap-2 text-xs text-fade" role="group" aria-label="Compare against">
          Compare with
          {choices.map((s, i) => (
            <button
              key={s}
              onClick={() => setSlug(s)}
              aria-pressed={slug === s}
              className={`rounded-full px-3 py-1 font-mono font-semibold transition-colors ${slug === s ? "bg-paper text-ink" : "bg-bench text-fade hover:text-paper"}`}
            >
              {i === 0 ? "this link" : "forked from"} /p/{s}
            </button>
          ))}
        </div>
      )}
      {choices.length === 1 && <p className="mb-3 text-xs text-fade">Compared with <span className="font-mono text-paper">/p/{choices[0]}</span>.</p>}

      {load.state === "loading" && <p className="py-8 text-center text-sm text-fade" role="status">Loading the shared version…</p>}
      {load.state === "error" && <p className="py-8 text-center text-sm text-danger" role="alert">Couldn't load /p/{slug}. Check your connection and try again.</p>}

      {diffs && (
        <>
          <div role="tablist" className="mb-2 flex gap-1">
            {tabs.map((t) => {
              const s = stat(t.id)!;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold ${tab === t.id ? "bg-bench text-paper" : "text-fade hover:text-paper"}`}
                >
                  {t.name}
                  {s.changed && <span className="tnum font-mono text-xs"><span className="text-css">+{s.added}</span> <span className="text-danger">−{s.removed}</span></span>}
                </button>
              );
            })}
          </div>
          {total === 0 ? (
            <p className="rounded-lg bg-bench px-4 py-6 text-center text-sm text-fade">No changes. Your work matches /p/{slug}.</p>
          ) : !stat(tab)!.changed ? (
            <p className="rounded-lg bg-bench px-4 py-6 text-center text-sm text-fade">No changes in {tabs.find((t) => t.id === tab)!.name}.</p>
          ) : (
            <pre className="overflow-auto rounded-lg bg-bench py-2 font-mono text-xs leading-5" aria-label={`${tab} changes`}>
              {rows.map((r, i) =>
                "gap" in r ? (
                  <div key={`g${i}`} className="px-4 text-fade/70">⋯ {r.gap} unchanged {r.gap === 1 ? "line" : "lines"}</div>
                ) : (
                  <div key={`${i}`} className={`flex whitespace-pre-wrap px-2 ${r.type === "add" ? "bg-css/15 text-paper" : r.type === "del" ? "bg-danger/15 text-paper" : "text-fade"}`}>
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
          )}
        </>
      )}
    </Modal>
  );
}
