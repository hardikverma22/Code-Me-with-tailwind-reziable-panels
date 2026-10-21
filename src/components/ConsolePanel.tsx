import { useState } from "react";
import { Trash2 } from "lucide-react";
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

function Findings() {
  const findings = useA11y((s) => s.findings);
  const html = useProject((s) => s.html);

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
          </li>
        );
      })}
    </ul>
  );
}

export default function ConsolePanel() {
  const entries = useConsole((s) => s.entries);
  const clear = useConsole((s) => s.clear);
  const findings = useA11y((s) => s.findings);
  const [tab, setTab] = useState<Tab>("console");

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
            </li>
          ))}
        </ul>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto font-mono text-xs" role="tabpanel" aria-label="Accessibility checks"><Findings /></div>
      )}
    </section>
  );
}
