import { useState } from "react";
import { Wand2 } from "lucide-react";
import Editor from "./Editor";
import { formatCode, type Language } from "../lib/format";
import { useProject } from "../store/project";

export const inkFor: Record<Language, { name: string; dot: string; text: string; bar: string }> = {
  html: { name: "HTML", dot: "bg-html", text: "text-html", bar: "bg-html" },
  css: { name: "CSS", dot: "bg-css", text: "text-css", bar: "bg-css" },
  js: { name: "JavaScript", dot: "bg-js", text: "text-js", bar: "bg-js" },
};

export default function EditorPane({ language }: { language: Language }) {
  const code = useProject((s) => s[language]);
  const setCode = useProject((s) => s.setCode);
  const [busy, setBusy] = useState(false);
  const ink = inkFor[language];

  const format = async () => {
    setBusy(true);
    setCode(language, await formatCode(code, language));
    setBusy(false);
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl bg-bed" aria-label={ink.name}>
      <header className="flex h-11 shrink-0 items-center justify-between px-4">
        <span className="flex items-center gap-2.5 text-sm font-bold text-paper">
          <span className={`size-2.5 rounded-full ${ink.dot}`} aria-hidden />
          {ink.name}
        </span>
        <button
          onClick={format}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-fade transition-colors hover:bg-bed-raised hover:text-paper disabled:opacity-50"
          title={`Format ${ink.name} with Prettier`}
        >
          <Wand2 size={14} aria-hidden /> Format
        </button>
      </header>
      <div className="min-h-0 flex-1 pb-2">
        <Editor language={language} value={code} onChange={(v) => setCode(language, v)} />
      </div>
    </section>
  );
}
