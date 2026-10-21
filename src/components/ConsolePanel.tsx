import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Trash2, Wrench } from "lucide-react";
import type { Sources } from "../lib/buildSrcDoc";
import FixDialog from "./FixDialog";
import type { Patch, Problem } from "../lib/fix/types";
import { useConsole } from "../store/console";
import { useA11y } from "../store/a11y";
import { useProject } from "../store/project";
import { locateInHtml, type A11yFinding } from "../lib/a11y";

const tone = {
  log: "text-paper",
  info: "text-css",
  debug: "text-fade",
  warn: "text-lemon",
  error: "text-danger",
} as const;

type Tab = "console" | "a11y";

const fixButton = "mt-1.5 flex items-center gap-1 rounded-md bg-bed-raised px-2 py-1 text-xs font-bold text-paper transition-colors hover:bg-rule";

function Findings({ html, onFix }: { html: string; onFix: (p: Problem) => void }) {
  const findings = useA11y((s) => s.findings);

  if (findings === null) return <p className="px-4 py-3 text-fade">Checking the page…</p>;
  if (findings.length === 0) return <p className="px-4 py-3 text-css">No accessibility problems found in the checks below.<span className="mt-1 block text-fade">Labels, alt text, link and button names, headings, duplicate ids and colour contrast. A clean result is not a full audit.</span></p>;

  const line = (f: A11yFinding) => locateInHtml(html, f);
  return (
    <ul>
      {findings.map((f, i) => {
        const at = line(f);
        return (
          <li key={i} className="border-b border-rule/60 px-4 py-2">
            <p className={f.severity === "error" ? "font-semibold text-danger" : "font-semibold text-lemon"}>
              <span className="sr-only">{f.severity}: </span>{f.message}
            </p>
            <p className="mt-0.5 text-fade">
              {f.rule}{at ? ` · HTML line ${at}` : ""}
            </p>
            <code className="mt-1 block truncate text-paper/80" title={f.snippet}>{f.snippet}</code>
            <button onClick={() => onFix({ type: "a11y", finding: f })} className={fixButton} aria-label={`Fix: ${f.message}`}>
              <Wrench size={12} aria-hidden /> Fix
            </button>
          </li>
        );
      })}
    </ul>
  );
}

type Props = {
  /** The code to fix. The editor leaves these out and the panel follows the saved project. */
  code?: Sources;
  getCurrent?: () => Patch;
  onApply?: (patch: Patch) => void;
  initialTab?: Tab;
};

const fromProject = () => {
  const { html, css, js } = useProject.getState();
  return { html, css, js };
};

export default function ConsolePanel({ code, getCurrent = fromProject, onApply, initialTab = "console" }: Props) {
  const entries = useConsole((s) => s.entries);
  const clear = useConsole((s) => s.clear);
  const findings = useA11y((s) => s.findings);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [fixing, setFixing] = useState<Problem | null>(null);
  const saved = useProject(useShallow((s) => ({ html: s.html, css: s.css, js: s.js, tailwind: s.tailwind, resources: s.resources })));
  const sources: Sources = code ?? saved;
  const apply =
    onApply ??
    ((patch: Patch) => {
      const { setCode, html, css, js } = useProject.getState();
      const now = { html, css, js };
      for (const l of ["html", "css", "js"] as const) if (patch[l] !== now[l]) setCode(l, patch[l]);
    });

  const tabClass = (on: boolean) => `flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-extrabold transition-colors ${on ? "text-paper" : "text-fade hover:text-paper"}`;
  const issues = findings?.length ?? 0;

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl bg-bed" aria-label="Console">
      <header className="flex h-11 shrink-0 items-center justify-between px-2.5">
        <div role="tablist" className="flex items-center">
          <button role="tab" aria-selected={tab === "console"} onClick={() => setTab("console")} className={tabClass(tab === "console")}>Console</button>
          <button role="tab" aria-selected={tab === "a11y"} onClick={() => setTab("a11y")} className={tabClass(tab === "a11y")}>
            Accessibility
            {findings !== null && (
              <span className={`tnum rounded-full px-1.5 text-xs font-bold ${issues > 0 ? "bg-danger text-ink" : "bg-css text-ink"}`} aria-label={`${issues} ${issues === 1 ? "issue" : "issues"}`}>{issues}</span>
            )}
          </button>
        </div>
        {tab === "console" && (
          <button onClick={clear} className="p-1 pr-1.5 text-fade transition-colors hover:text-paper" aria-label="Clear console">
            <Trash2 size={14} />
          </button>
        )}
      </header>
      {tab === "console" ? (
        <ul className="min-h-0 flex-1 overflow-auto font-mono text-xs" role="log">
          {entries.length === 0 && (
            <li className="px-4 py-3 text-fade">console.log() and errors from your code appear here.</li>
          )}
          {entries.map((e) => (
            <li key={e.id} className={`whitespace-pre-wrap border-b border-rule/60 px-4 py-1.5 ${tone[e.kind]}`}>
              {e.text}
              {e.kind === "error" && (
                <button onClick={() => setFixing({ type: "error", message: e.text })} className={fixButton} aria-label={`Fix: ${e.text.split("\n")[0]}`}>
                  <Wrench size={12} aria-hidden /> Fix
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto font-mono text-xs" role="tabpanel" aria-label="Accessibility checks"><Findings html={sources.html} onFix={setFixing} /></div>
      )}
      {fixing && <FixDialog problem={fixing} sources={sources} getCurrent={getCurrent} onApply={apply} onClose={() => setFixing(null)} />}
    </section>
  );
}
