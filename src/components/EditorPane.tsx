import { useState } from "react";
import { Wand2 } from "lucide-react";
import Editor from "./Editor";
import { formatCode, type Language } from "../lib/format";
import { useProject } from "../store/project";

const labels: Record<Language, { name: string; dot: string }> = {
  html: { name: "HTML", dot: "bg-orange-400" },
  css: { name: "CSS", dot: "bg-sky-400" },
  js: { name: "JavaScript", dot: "bg-yellow-300" },
};

export default function EditorPane({ language }: { language: Language }) {
  const code = useProject((s) => s[language]);
  const setCode = useProject((s) => s.setCode);
  const [busy, setBusy] = useState(false);

  const format = async () => {
    setBusy(true);
    setCode(language, await formatCode(code, language));
    setBusy(false);
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-panel" aria-label={labels[language].name}>
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-line px-3">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className={`size-2 rounded-full ${labels[language].dot}`} aria-hidden />
          {labels[language].name}
        </span>
        <button
          onClick={format}
          disabled={busy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted transition-colors hover:bg-raised hover:text-ink disabled:opacity-50"
          title={`Format ${labels[language].name} with Prettier`}
        >
          <Wand2 size={14} aria-hidden /> Format
        </button>
      </header>
      <div className="min-h-0 flex-1">
        <Editor language={language} value={code} onChange={(v) => setCode(language, v)} />
      </div>
    </section>
  );
}
