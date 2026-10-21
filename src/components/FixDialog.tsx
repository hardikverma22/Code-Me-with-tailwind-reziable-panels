import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Cpu, Loader2, ShieldCheck } from "lucide-react";
import Modal from "./Modal";
import DiffRows from "./DiffRows";
import { diffStats, lineDiff } from "../lib/diff";
import type { Language } from "../lib/format";
import type { Sources } from "../lib/buildSrcDoc";
import { rulesEngine } from "../lib/fix/rules";
import { NanoEngine, nanoState, type NanoState } from "../lib/fix/nano";
import { runFix, type FixResult, type Progress } from "../lib/fix/run";
import { FixUnavailable, type EngineId, type Patch, type Problem } from "../lib/fix/types";

const TABS: { id: Language; name: string }[] = [{ id: "html", name: "HTML" }, { id: "css", name: "CSS" }, { id: "js", name: "JavaScript" }];

type State =
  | { kind: "running"; progress: Progress | null }
  | { kind: "done"; result: FixResult; tried: EngineId };

const engineName = (id: EngineId) => (id === "rules" ? "Rules" : "Gemini Nano");

function describe(problem: Problem) {
  return problem.type === "a11y" ? problem.finding.message : problem.message.split("\n")[0];
}

function progressText(p: Progress | null, download: number | null) {
  // The model is loaded into memory after the download reaches 100%, which can take several seconds.
  if (download !== null) return download >= 1 ? "Starting the on-device model…" : `Downloading the on-device model: ${Math.round(download * 100)}%`;
  if (!p) return "Looking for a fix…";
  if (p.stage === "checking") return "Checking the fix in a sandbox…";
  return p.engine === "rules" ? "Trying a rule-based fix…" : `Asking Gemini Nano (try ${p.attempt} of ${p.of})…`;
}

/**
 * Finds a fix for one problem and proves it before showing it: the change is run in a hidden sandbox
 * and kept only if the problem is gone and nothing new is wrong. Rules go first; the on-device model
 * is offered only when rules have nothing, and only starts when asked.
 */
type Props = {
  problem: Problem;
  /** The code the fix is about, as it is when the dialog opens. */
  sources: Sources;
  /** The code as it is now, so Apply can refuse when it changed while the dialog was open. */
  getCurrent: () => Patch;
  onApply: (patch: Patch) => void;
  onClose: () => void;
};

export default function FixDialog({ problem, sources: opened, getCurrent, onApply, onClose }: Props) {
  const [sources] = useState<Sources>(opened);
  const [state, setState] = useState<State>({ kind: "running", progress: null });
  const [nano, setNano] = useState<NanoState | null>(null);
  const [download, setDownload] = useState<number | null>(null);
  const [tab, setTab] = useState<Language | null>(null);
  const [stale, setStale] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const engine = useRef<NanoEngine | null>(null);

  const start = useCallback(
    async (kind: EngineId) => {
      abort.current?.abort();
      const ctl = new AbortController();
      abort.current = ctl;
      const live = () => !ctl.signal.aborted;
      try {
        let engines;
        if (kind === "rules") engines = [rulesEngine];
        else {
          engine.current ??= await NanoEngine.create((f) => live() && setDownload(f), ctl.signal);
          if (live()) setDownload(null);
          engines = [engine.current];
        }
        const result = await runFix({ problem, sources, engines, signal: ctl.signal, onProgress: (p) => live() && setState({ kind: "running", progress: p }) });
        if (live()) setState({ kind: "done", result, tried: kind });
      } catch (e) {
        if (!live() || (e instanceof DOMException && e.name === "AbortError")) return;
        const note = e instanceof FixUnavailable ? e.message : "Something went wrong while looking for a fix.";
        setDownload(null);
        setState({ kind: "done", result: { ok: false, note, attempts: 0 }, tried: kind });
      }
    },
    [problem, sources]
  );

  useEffect(() => {
    // Deferred a tick so a strict-mode remount cancels it instead of running the check twice.
    const kickoff = setTimeout(() => void start("rules"), 0);
    void nanoState().then(setNano);
    return () => {
      clearTimeout(kickoff);
      abort.current?.abort();
      engine.current?.destroy();
      engine.current = null;
    };
  }, [start]);

  const askModel = () => {
    setState({ kind: "running", progress: null });
    void start("nano");
  };

  const result = state.kind === "done" ? state.result : null;
  const changed = useMemo(
    () => (result?.ok ? TABS.filter((t) => result.patch[t.id] !== sources[t.id]) : []),
    [result, sources]
  );
  const shown = tab && changed.some((t) => t.id === tab) ? tab : changed[0]?.id;

  const apply = () => {
    if (!result?.ok) return;
    const cur = getCurrent();
    if (TABS.some((t) => cur[t.id] !== sources[t.id])) return setStale(true);
    onApply(result.patch);
    onClose();
  };

  const btn = "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors";
  const canAsk = nano === "ready" || nano === "downloadable" || nano === "downloading";

  return (
    <Modal
      title="Fix this problem"
      onClose={onClose}
      wide
      footer={
        <>
          <button onClick={onClose} className={`${btn} text-fade hover:text-paper`}>{result?.ok ? "Cancel" : "Close"}</button>
          {result?.ok && <button onClick={apply} className={`${btn} bg-paper text-ink`}><Check size={14} aria-hidden /> Apply fix</button>}
        </>
      }
    >
      <p className="mb-3 rounded-lg bg-bench px-3 py-2 text-sm text-paper/90">{describe(problem)}</p>

      {state.kind === "running" && (
        <div className="py-6 text-sm text-fade" role="status">
          <p className="flex items-center gap-2">
            <Loader2 size={16} className="animate-spin" aria-hidden /> {progressText(state.progress, download)}
          </p>
          {state.progress?.lastNote && <p className="mt-2 pl-6 text-paper/70">The last try didn't work: {state.progress.lastNote}</p>}
        </div>
      )}

      {result?.ok && (
        <>
          <p className="flex items-start gap-2 text-sm font-semibold text-css" role="status">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
            Checked in a sandbox: the problem is gone and nothing new appeared.
          </p>
          <p className="mb-3 mt-1 text-sm text-fade">
            {result.summary} <span className="text-paper/70">({engineName(result.engine)}{result.attempts > 1 ? `, try ${result.attempts}` : ""})</span>
          </p>
          {changed.length > 1 && (
            <div role="tablist" className="mb-2 flex gap-1">
              {changed.map((t) => {
                const s = diffStats(lineDiff(sources[t.id], result.patch[t.id]));
                return (
                  <button key={t.id} role="tab" aria-selected={shown === t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-bold ${shown === t.id ? "bg-bench text-paper" : "text-fade hover:text-paper"}`}>
                    {t.name} <span className="tnum font-mono text-xs"><span className="text-css">+{s.added}</span> <span className="text-danger">−{s.removed}</span></span>
                  </button>
                );
              })}
            </div>
          )}
          {shown && <DiffRows lines={lineDiff(sources[shown], result.patch[shown])} label={`${shown} changes`} />}
          {stale && <p className="mt-3 text-sm font-semibold text-danger" role="alert">Your code changed while this was open. Close this and try again.</p>}
        </>
      )}

      {result && !result.ok && (
        <div className="space-y-3 text-sm">
          <p className="text-paper" role="status">{result.note}</p>
          {state.kind === "done" && state.tried === "rules" && <p className="text-fade">No rule covers this one. Nothing was changed.</p>}
          {canAsk ? (
            <div className="rounded-lg bg-bench p-3">
              <button onClick={askModel} className={`${btn} bg-paper text-ink`}>
                <Cpu size={14} aria-hidden /> {nano === "ready" ? (state.kind === "done" && state.tried === "nano" ? "Try Gemini Nano again" : "Try on-device AI (Gemini Nano)") : "Download on-device AI and try"}
              </button>
              <p className="mt-2 text-xs text-fade">
                Uses Chrome's built-in model, which runs on this device: your code is not sent anywhere.
                {nano !== "ready" && " Chrome downloads the model once, which can take a while."} Every answer is checked in a sandbox before you see it.
              </p>
            </div>
          ) : (
            nano && <p className="text-xs text-fade">{nano === "missing" ? "Smarter fixes use Chrome's built-in on-device AI, which this browser doesn't have." : "Chrome's on-device AI isn't available on this device. It needs desktop Chrome with enough free disk space and memory."}</p>
          )}
        </div>
      )}
    </Modal>
  );
}
