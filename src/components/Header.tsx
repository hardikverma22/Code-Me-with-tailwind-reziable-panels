import { useState } from "react";
import { Check, FilePlus2, Link2, Sparkles } from "lucide-react";
import { useProject } from "../store/project";
import { encodeShare } from "../lib/share";

export default function Header() {
  const { reset, loadExample } = useProject();
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const { html, css, js } = useProject.getState();
    history.replaceState(null, "", encodeShare({ html, css, js }));
    try {
      await navigator.clipboard.writeText(location.href);
    } catch {
      /* the link is still in the address bar */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const btn =
    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between px-4">
      <h1 className="text-lg font-bold tracking-tight">
        Code<span className="text-accent">Me</span>
      </h1>
      <nav className="flex items-center gap-1" aria-label="Project actions">
        <button className={btn} onClick={reset}>
          <FilePlus2 size={16} aria-hidden /> New
        </button>
        <button className={btn} onClick={loadExample}>
          <Sparkles size={16} aria-hidden /> Example
        </button>
        <button
          onClick={share}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-bench transition-opacity hover:opacity-90"
        >
          {copied ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
          {copied ? "Link copied" : "Share"}
        </button>
      </nav>
      <span className="sr-only" role="status">{copied ? "Link copied to clipboard" : ""}</span>
    </header>
  );
}
