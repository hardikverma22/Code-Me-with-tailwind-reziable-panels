import { useState } from "react";
import { Link } from "react-router";
import { Check, FilePlus2, FolderOpen, LayoutGrid, Link2 } from "lucide-react";
import { useProject } from "../store/project";
import { useMine, titleFromHtml } from "../store/mine";
import { encodeShare } from "../lib/share";
import { convex } from "../lib/convex";
import { api } from "../../convex/_generated/api";
import Logo from "./Logo";

type ShareState = "idle" | "saving" | "copied" | "error";

export default function Header() {
  const { reset } = useProject();
  const addMine = useMine((s) => s.add);
  const [state, setState] = useState<ShareState>("idle");

  const share = async () => {
    const { html, css, js, parentSlug } = useProject.getState();
    setState("saving");
    try {
      if (convex) {
        const slug = await convex.mutation(api.projects.create, {
          html, css, js, ...(parentSlug ? { forkedFrom: parentSlug } : {}),
        });
        useProject.setState({ parentSlug: slug });
        addMine({ slug, html, css, js, title: titleFromHtml(html), createdAt: Date.now() });
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

  const link =
    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-fade no-underline transition-colors hover:bg-bed-raised hover:text-paper";
  const label = { idle: "Share", saving: "Saving…", copied: "Link copied", error: "Couldn't share. Try again." }[state];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
      <Logo onDark />
      <nav className="flex items-center" aria-label="Editor">
        <button className={link} onClick={() => { reset(); history.replaceState(null, "", "/new"); }}>
          <FilePlus2 size={16} aria-hidden /> <span className="hidden sm:inline">New</span>
        </button>
        <Link className={link} to="/gallery"><LayoutGrid size={16} aria-hidden /> <span className="hidden sm:inline">Templates</span></Link>
        <Link className={link} to="/mine"><FolderOpen size={16} aria-hidden /> <span className="hidden sm:inline">My work</span></Link>
        <button
          onClick={share}
          disabled={state === "saving"}
          className="ml-2 flex items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-sm font-bold text-ink transition hover:shadow-[0_0_0_4px_rgb(123_97_255_/_0.45)] disabled:opacity-60"
        >
          {state === "copied" ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
          {label}
        </button>
      </nav>
      <span className="sr-only" role="status">{state === "copied" ? "Link copied to clipboard" : ""}</span>
    </header>
  );
}
