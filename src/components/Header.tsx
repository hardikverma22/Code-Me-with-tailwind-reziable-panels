import { useState } from "react";
import { Check, FilePlus2, Link2, Sparkles } from "lucide-react";
import { useProject } from "../store/project";
import { encodeShare } from "../lib/share";
import { convex } from "../lib/convex";
import { api } from "../../convex/_generated/api";

type ShareState = "idle" | "saving" | "copied" | "error";

export default function Header() {
  const { reset, loadExample } = useProject();
  const [state, setState] = useState<ShareState>("idle");

  const clearUrl = () => history.replaceState(null, "", "/");

  const share = async () => {
    const { html, css, js, parentSlug } = useProject.getState();
    setState("saving");
    try {
      if (convex) {
        const slug = await convex.mutation(api.projects.create, {
          html, css, js, ...(parentSlug ? { forkedFrom: parentSlug } : {}),
        });
        useProject.setState({ parentSlug: slug });
        history.replaceState(null, "", `/p/${slug}`);
      } else {
        history.replaceState(null, "", encodeShare({ html, css, js }));
      }
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
      return;
    }
    try {
      await navigator.clipboard.writeText(location.href);
    } catch {
      /* the link is still in the address bar */
    }
    setState("copied");
    setTimeout(() => setState("idle"), 2000);
  };

  const btn =
    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-raised hover:text-ink";

  const label = { idle: "Share", saving: "Saving…", copied: "Link copied", error: "Couldn't share" }[state];

  return (
    <header className="flex h-12 shrink-0 items-center justify-between px-4">
      <h1 className="text-lg font-bold tracking-tight">
        Code<span className="text-accent">Me</span>
      </h1>
      <nav className="flex items-center gap-1" aria-label="Project actions">
        <button className={btn} onClick={() => { reset(); clearUrl(); }}>
          <FilePlus2 size={16} aria-hidden /> New
        </button>
        <button className={btn} onClick={() => { loadExample(); clearUrl(); }}>
          <Sparkles size={16} aria-hidden /> Example
        </button>
        <button
          onClick={share}
          disabled={state === "saving"}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-semibold text-bench transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "copied" ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
          {label}
        </button>
      </nav>
      <span className="sr-only" role="status">{state === "copied" ? "Link copied to clipboard" : ""}</span>
    </header>
  );
}
