import { Trash2 } from "lucide-react";
import { useConsole } from "../store/console";

const tone = {
  log: "text-paper",
  info: "text-css",
  debug: "text-fade",
  warn: "text-lemon",
  error: "text-danger",
} as const;

export default function ConsolePanel() {
  const entries = useConsole((s) => s.entries);
  const clear = useConsole((s) => s.clear);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-xl bg-bed" aria-label="Console">
      <header className="flex h-11 shrink-0 items-center justify-between px-4">
        <span className="text-sm font-extrabold">Console</span>
        <button onClick={clear} className="p-1 text-fade transition-colors hover:text-paper" aria-label="Clear console">
          <Trash2 size={14} />
        </button>
      </header>
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
    </section>
  );
}
