import { useEffect, useRef, useState } from "react";
import { Plus, Settings2, X } from "lucide-react";
import { useProject } from "../store/project";
import type { Resource } from "../lib/buildSrcDoc";

const MAX = 5;
const isHttps = (u: string) => /^https:\/\/[^\s"<>]+$/.test(u) && u.length <= 300;

/** Per-project settings: CSS framework and external scripts/styles, loaded before your own code. */
export default function SettingsPanel() {
  const { tailwind: tw, setTailwind, resources: res, setResources } = useProject();
  const tailwind = Boolean(tw);
  const resources = res ?? [];
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const add = () => {
    const u = url.trim();
    if (!isHttps(u)) return setError("Enter a full https:// link.");
    if (resources.length >= MAX) return setError(`You can add up to ${MAX} resources.`);
    if (resources.some((r) => r.url === u)) return setError("Already added.");
    const kind: Resource["kind"] = /\.css(\?|$)/i.test(u) ? "style" : "script";
    setResources([...resources, { kind, url: u }]);
    setUrl(""); setError("");
  };

  const count = resources.length + (tailwind ? 1 : 0);
  const seg = (on: boolean) => `flex-1 rounded-md px-3 py-1.5 text-sm font-bold transition-colors ${on ? "bg-paper text-ink" : "text-fade hover:text-paper"}`;

  return (
    <div ref={box} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-fade transition-colors hover:bg-bed-raised hover:text-paper"
      >
        <Settings2 size={16} aria-hidden /> <span className="hidden lg:inline">Settings</span>
        {count > 0 && <span className="tnum rounded-full bg-violet px-1.5 text-xs text-white">{count}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Project settings" className="absolute right-0 top-full z-30 mt-2 w-[340px] rounded-xl bg-bed-raised p-4 text-paper shadow-2xl ring-1 ring-rule">
          <p className="text-xs font-bold text-fade">CSS framework</p>
          <div className="mt-2 flex gap-1 rounded-lg bg-bench p-1" role="group" aria-label="CSS framework">
            <button className={seg(!tailwind)} aria-pressed={!tailwind} onClick={() => setTailwind(false)}>None</button>
            <button className={seg(tailwind)} aria-pressed={tailwind} onClick={() => setTailwind(true)}>Tailwind v4</button>
          </div>
          {tailwind && <p className="mt-2 text-xs text-fade">Uses Tailwind's browser build. It's for development and needs internet. Write <code className="text-css">@apply</code> in the CSS tab.</p>}

          <p className="mt-5 text-xs font-bold text-fade">External scripts and styles</p>
          <p className="mt-1 text-xs text-fade">Loaded before your JavaScript, in order. Links ending in .css become stylesheets.</p>
          <ul className="mt-2 space-y-1">
            {resources.map((r) => (
              <li key={r.url} className="flex items-center gap-2 rounded-md bg-bench px-2 py-1.5">
                <span className={`rounded px-1.5 text-[10px] font-bold ${r.kind === "style" ? "bg-css text-ink" : "bg-js text-ink"}`}>{r.kind === "style" ? "CSS" : "JS"}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-xs" title={r.url}>{r.url.replace("https://", "")}</span>
                <button onClick={() => setResources(resources.filter((x) => x.url !== r.url))} aria-label={`Remove ${r.url}`} className="text-fade hover:text-paper"><X size={14} /></button>
              </li>
            ))}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(); }}>
            <label className="sr-only" htmlFor="res-url">Resource link</label>
            <input id="res-url" value={url} onChange={(e) => { setUrl(e.target.value); setError(""); }} placeholder="https://cdn.jsdelivr.net/npm/..." className="min-w-0 flex-1 rounded-md bg-bench px-2 py-1.5 font-mono text-xs text-paper placeholder:text-fade/70 focus:outline-2 focus:outline-aqua" />
            <button className="flex items-center gap-1 rounded-md bg-paper px-3 text-sm font-bold text-ink"><Plus size={14} aria-hidden /> Add</button>
          </form>
          {error && <p className="mt-1.5 text-xs font-semibold text-danger" role="alert">{error}</p>}
        </div>
      )}
    </div>
  );
}
