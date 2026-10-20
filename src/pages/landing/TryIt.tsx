import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import Editor from "../../components/Editor";
import PreviewFrame from "../../components/PreviewFrame";
import ProofSheet from "../../components/ProofSheet";
import Magnetic from "../../fx/Magnetic";
import { inkFor } from "../../components/EditorPane";
import { useProject } from "../../store/project";
import type { Language } from "../../lib/format";

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
};
`,
};
const languages: Language[] = ["html", "css", "js"];

export default function TryIt() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Language>("html");
  const [code, setCode] = useState(starter);

  return (
    <section className="on-dark relative overflow-hidden bg-bed py-28 text-paper lg:py-40">
      <div className="mx-auto max-w-[1480px] px-5 md:px-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-[clamp(2.8rem,7vw,6rem)]">Your turn.</h2>
          <p className="max-w-[34ch] text-xl text-paper/75">Change anything below. The result updates as you type.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="lift overflow-hidden rounded-2xl bg-bench" data-cursor>
            <div role="tablist" className="flex items-center gap-1 px-3 pt-3" aria-label="Edit a file">
              {languages.map((l) => (
                <button key={l} role="tab" aria-selected={tab === l} onClick={() => setTab(l)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === l ? "bg-bed-raised text-paper" : "text-fade hover:text-paper"}`}>
                  <span className={`size-2 rounded-full ${inkFor[l].dot}`} aria-hidden />
                  {l === "js" ? "JS" : l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="h-[280px] pt-1">
              <Editor language={tab} value={code[tab]} onChange={(v) => setCode((c) => ({ ...c, [tab]: v }))} />
            </div>
          </div>
          <ProofSheet className="h-[280px] lg:h-auto lg:min-h-[330px]">
            <PreviewFrame sources={code} debounceMs={350} className="h-full w-full bg-white" />
          </ProofSheet>
        </div>
        <div className="mt-10">
          <Magnetic>
            <button
              onClick={() => { useProject.getState().load(code, null); navigate("/new"); }}
              className="group flex items-center gap-2 rounded-full bg-paper px-8 py-4 text-lg font-bold text-ink"
            >
              Keep going in the full editor <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
          </Magnetic>
        </div>
      </div>
    </section>
  );
}
