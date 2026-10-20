import { Trash2 } from "lucide-react";
import { useConsole } from "../store/console";

const tone = {
  log: "text-ink",
  info: "text-accent",
  debug: "text-muted",
  warn: "text-warn",
  error: "text-danger",
} as const;

export default function ConsolePanel() {
  const entries = useConsole((s) => s.entries);
  const clear = useConsole((s) => s.clear);

  return (
    <section className="flex h-full min-h-0 flex-col bg-panel" aria-label="Console">
      <header className="flex h-9 shrink-0 items-center justify-between border-b border-line px-3">
        <span className="text-sm font-semibold">Console</span>
        <button
          onClick={clear}
          className="rounded p-1 text-muted transition-colors hover:bg-raised hover:text-ink"
          aria-label="Clear console"
        >
          <Trash2 size={14} />
        </button>
      </header>
      <ul className="min-h-0 flex-1 overflow-auto font-mono text-xs" role="log">
        {entries.length === 0 && (
          <li className="px-3 py-2 text-muted">Output from console.log and errors will show up here.</li>
        )}
        {entries.map((e) => (
          <li key={e.id} className={`whitespace-pre-wrap border-b border-line/50 px-3 py-1.5 ${tone[e.kind]}`}>
            {e.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
