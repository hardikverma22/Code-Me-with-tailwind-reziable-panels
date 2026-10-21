import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight, RotateCcw } from "lucide-react";
import Editor from "../../components/Editor";
import ConsolePanel from "../../components/ConsolePanel";
import PreviewFrame from "../../components/PreviewFrame";
import { inkFor } from "../../components/EditorPane";
import { useA11y } from "../../store/a11y";
import { useConsole } from "../../store/console";
import { useProject } from "../../store/project";
import { nanoState, type NanoState } from "../../lib/fix/nano";
import type { Patch } from "../../lib/fix/types";
import type { Language } from "../../lib/format";
import type { PreviewMessage, Sources } from "../../lib/buildSrcDoc";
import { brokenPlan } from "./example";

const languages: Language[] = ["html", "css", "js"];

const aiLine: Record<NanoState, string> = {
  ready: "On-device AI is ready in this browser. Rules go first, and it steps in when they have nothing.",
  downloadable: "On-device AI is available here. Chrome downloads it once, and only if you ask for it.",
  downloading: "Chrome is downloading the on-device AI.",
  unavailable: "On-device AI isn't available on this device, so only the rule-based fixes will run.",
  missing: "This browser has no built-in AI, so only the rule-based fixes will run. Desktop Chrome has both.",
};

/** A broken page you can fix for real: the same checker, rules and sandbox check the editor uses. */
export default function Fix() {
  const navigate = useNavigate();
  const [code, setCode] = useState<Patch>(brokenPlan);
  const [tab, setTab] = useState<Language>("html");
  const [ai, setAi] = useState<NanoState | null>(null);
  const latest = useRef(code);
  const push = useConsole((s) => s.push);
  const clear = useConsole((s) => s.clear);
  const setFindings = useA11y((s) => s.set);
  const resetFindings = useA11y((s) => s.reset);

  useEffect(() => { latest.current = code; }, [code]);
  useEffect(() => { void nanoState().then(setAi); }, []);

  const sources = useMemo<Sources>(() => ({ ...code, tailwind: false, resources: [] }), [code]);
  const getCurrent = useCallback(() => latest.current, []);
  const apply = useCallback((patch: Patch) => {
    // Show where the change landed: jump to the first tab it touched.
    const touched = languages.find((l) => patch[l] !== latest.current[l]);
    setCode(patch);
    if (touched) setTab(touched);
  }, []);

  const onMessage = useCallback((m: PreviewMessage) => (m.kind === "a11y" ? setFindings(m.findings) : push(m.kind, m.args)), [push, setFindings]);
  const onRun = useCallback(() => { clear(); resetFindings(); }, [clear, resetFindings]);

  const startOver = () => { setCode(brokenPlan); setTab("html"); };
  const openInEditor = () => { useProject.getState().load({ ...code, tailwind: false, resources: [] }, null); navigate("/new"); };

  return (
    <section id="fix" className="on-dark relative overflow-hidden bg-bed py-28 text-paper lg:py-40">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        <div className="grid gap-10 lg:grid-cols-12">
          <h2 className="display text-[clamp(2.4rem,5vw,4.5rem)] lg:col-span-6">It finds the problem. Then it proves the fix.</h2>
          <div className="max-w-[60ch] space-y-5 text-lg leading-snug text-paper/80 lg:col-span-5 lg:col-start-8">
            <p><strong className="font-bold text-paper">It checks as you type.</strong> Your page runs in a sandbox, and CodeMe flags what breaks: missing labels, low contrast, skipped headings and errors in your JavaScript, each with the line it is on.</p>
            <p><strong className="font-bold text-paper">It fixes what it can.</strong> Rules handle the mechanical ones instantly. For the rest, Chrome's built-in AI proposes a change on your device: no account, no key, and your code never leaves your computer.</p>
            <p><strong className="font-bold text-paper">It proves the fix before you see it.</strong> Each fix runs in a hidden copy of your page and is shown only if the problem is gone and nothing new broke. You read the diff, then press Apply.</p>
          </div>
        </div>

        <p className="mt-14 max-w-[60ch] text-xl font-semibold text-paper">This page has five problems. Press Fix on any of them.</p>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="lift flex flex-col overflow-hidden rounded-2xl bg-bench" data-cursor data-lenis-prevent="">
            <div className="flex items-center justify-between px-3 pt-3">
              <div role="tablist" className="flex items-center gap-1" aria-label="Edit a file">
                {languages.map((l) => (
                  <button key={l} role="tab" aria-selected={tab === l} onClick={() => setTab(l)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === l ? "bg-bed-raised text-paper" : "text-fade hover:text-paper"}`}>
                    <span className={`size-2 rounded-full ${inkFor[l].dot}`} aria-hidden />
                    {l === "js" ? "JS" : l.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={startOver} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-fade transition-colors hover:bg-bed-raised hover:text-paper">
                <RotateCcw size={14} aria-hidden /> Start over
              </button>
            </div>
            <div className="h-[340px] min-h-0 pt-1 lg:h-auto lg:flex-1">
              <Editor language={tab} value={code[tab]} onChange={(v) => setCode((c) => ({ ...c, [tab]: v }))} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4">
            <div className="lift h-[360px] overflow-hidden rounded-2xl bg-white">
              <PreviewFrame sources={sources} debounceMs={350} onMessage={onMessage} onRun={onRun} className="h-full w-full bg-white" title="Preview of the plan card" />
            </div>
            <div className="h-[300px] min-h-0" data-lenis-prevent="">
              <ConsolePanel code={sources} getCurrent={getCurrent} onApply={apply} initialTab="a11y" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
          <p className="max-w-[64ch] text-base text-paper/70" role="status">{ai ? aiLine[ai] : "Checking whether this browser has on-device AI…"}</p>
          <button onClick={openInEditor} className="group flex items-center gap-2 rounded-full border border-paper/40 px-7 py-3.5 text-lg font-bold text-paper transition-colors hover:border-paper hover:bg-paper hover:text-ink">
            Open this page in the editor <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
