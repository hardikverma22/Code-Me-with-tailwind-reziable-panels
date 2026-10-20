import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router";
import gsap from "gsap";
import { ArrowRight, Monitor, Smartphone, Tablet, Trash2, Wand2 } from "lucide-react";
import Editor from "../../components/Editor";
import PreviewFrame from "../../components/PreviewFrame";
import Magnetic from "../../fx/Magnetic";
import { inkFor } from "../../components/EditorPane";
import { useProject } from "../../store/project";
import { formatCode, type Language } from "../../lib/format";
import { templateById } from "../../lib/templates";
import type { PreviewMessage } from "../../lib/buildSrcDoc";

const starter = {
  html: `<h1>Your turn</h1>
<button id="go">Press me</button>
<p id="out"></p>
`,
  css: `body { font: 700 20px system-ui; padding: 24px; color: #12122b; }
h1 { font-size: 40px; margin: 0 0 14px; }
button { background: #7b61ff; color: #fff; border: 0; border-radius: 999px; padding: 12px 22px; font: inherit; cursor: pointer; }
`,
  js: `let n = 0;
document.getElementById("go").onclick = () => {
  document.getElementById("out").textContent = "Pressed " + ++n + " times";
  console.log("pressed", n);
};
`,
};
const languages: Language[] = ["html", "css", "js"];
const devices = [
  { id: "mobile", label: "Phone", w: 375, Icon: Smartphone },
  { id: "tablet", label: "Tablet", w: 768, Icon: Tablet },
  { id: "full", label: "Desktop", w: 0, Icon: Monitor },
] as const;
const picks = ["loader-dots", "spin-cube", "typewriter", "theme-switch", "todo"].map((id) => templateById(id)!).filter(Boolean);

type Log = { id: number; kind: string; text: string };
let logId = 0;

/** A small but complete playground: templates, device sizes, console and Prettier. */
export default function TryIt() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Language>("html");
  const [code, setCode] = useState(starter);
  const [device, setDevice] = useState<(typeof devices)[number]["id"]>("full");
  const [logs, setLogs] = useState<Log[]>([]);
  const frame = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const pickDevice = (d: (typeof devices)[number]) => {
    setDevice(d.id);
    const full = stage.current?.clientWidth ?? 600;
    gsap.to(frame.current, { width: d.w || full, duration: 0.7, ease: "expo.out" });
  };

  const loadTemplate = (t: (typeof picks)[number]) => {
    gsap.timeline()
      .to(stage.current, { opacity: 0, y: 8, duration: 0.15 })
      .call(() => setCode({ html: t.html, css: t.css, js: t.js }))
      .to(stage.current, { opacity: 1, y: 0, duration: 0.45, ease: "expo.out" });
  };


  const onMessage = useCallback((m: PreviewMessage) => setLogs((l) => [...l, { id: logId++, kind: m.kind, text: m.args.join(" ") }].slice(-40)), []);
  const onRun = useCallback(() => setLogs([]), []);

  const chip = "rounded-full border border-paper/15 px-4 py-2 text-sm font-semibold text-paper/85 transition-colors hover:border-paper/50 hover:text-paper";

  return (
    <section className="on-dark relative overflow-hidden bg-bed py-28 text-paper lg:py-40">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(2.8rem,7vw,6rem)]">Your turn.</h2>
          <p className="max-w-[36ch] text-xl text-paper/75">Pick a starting point, change anything, resize the preview. It all runs right here.</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" aria-label="Starting points">
          <button className={`${chip} border-paper/50 text-paper`} onClick={() => setCode(starter)}>Blank starter</button>
          {picks.map((t) => (
            <button key={t.id} className={chip} onClick={() => loadTemplate(t)}>{t.title}</button>
          ))}
        </div>

        <div ref={stage} className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="lift flex flex-col overflow-hidden rounded-2xl bg-bench" data-cursor>
            <div className="flex items-center justify-between px-3 pt-3">
              <div role="tablist" className="flex items-center gap-1" aria-label="Edit a file">
                {languages.map((l) => (
                  <button key={l} role="tab" aria-selected={tab === l} onClick={() => setTab(l)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === l ? "bg-bed-raised text-paper" : "text-fade hover:text-paper"}`}>
                    <span className={`size-2 rounded-full ${inkFor[l].dot}`} aria-hidden />
                    {l === "js" ? "JS" : l.toUpperCase()}
                  </button>
                ))}
              </div>
              <button onClick={() => void formatCode(code[tab], tab).then((f) => setCode((c) => ({ ...c, [tab]: f })))} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-fade transition-colors hover:bg-bed-raised hover:text-paper">
                <Wand2 size={14} aria-hidden /> Format
              </button>
            </div>
            <div className="h-[320px] pt-1 lg:h-[400px]">
              <Editor language={tab} value={code[tab]} onChange={(v) => setCode((c) => ({ ...c, [tab]: v }))} />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1" role="group" aria-label="Preview size">
                {devices.map((d) => (
                  <button key={d.id} onClick={() => pickDevice(d)} aria-pressed={device === d.id} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${device === d.id ? "bg-paper text-ink" : "text-fade hover:text-paper"}`}>
                    <d.Icon size={15} aria-hidden /> {d.label}
                  </button>
                ))}
              </div>
              <span className="tnum font-mono text-xs text-fade">{devices.find((d) => d.id === device)?.w || "100%"}{device === "full" ? "" : "px"}</span>
            </div>
            <div className="grid h-[320px] place-items-center overflow-hidden rounded-2xl bg-bench/70 p-3 lg:h-[330px]">
              <div ref={frame} className="lift h-full max-w-full overflow-hidden rounded-xl bg-white" style={{ width: "100%" }}>
                <PreviewFrame sources={code} debounceMs={350} onMessage={onMessage} onRun={onRun} className="h-full w-full bg-white" />
              </div>
            </div>
            <div className="h-[100px] overflow-hidden rounded-xl bg-bench">
              <div className="flex items-center justify-between px-4 pt-2 text-xs font-bold text-fade">
                Console
                <button onClick={() => setLogs([])} aria-label="Clear console" className="hover:text-paper"><Trash2 size={13} /></button>
              </div>
              <ul className="h-[68px] overflow-auto px-4 pb-2 font-mono text-xs" role="log">
                {logs.length === 0 && <li className="text-fade">console.log() output shows up here. Press the button.</li>}
                {logs.map((l) => <li key={l.id} className={l.kind === "error" ? "text-danger" : "text-paper"}>{l.text}</li>)}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <Magnetic>
            <button onClick={() => { useProject.getState().load(code, null); navigate("/new"); }} className="group flex items-center gap-2 rounded-full bg-paper px-8 py-4 text-lg font-bold text-ink">
              Keep going in the full editor <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
