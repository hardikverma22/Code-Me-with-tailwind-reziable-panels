import { useState } from "react";
import { Link } from "react-router";
import { Check, Download, FilePlus2, FolderOpen, GitCompareArrows, GitFork, LayoutGrid, Link2 } from "lucide-react";
import { useProject } from "../store/project";
import { useMine, titleFromHtml } from "../store/mine";
import { encodeShare } from "../lib/share";
import { canShare, ShareError, shareProject } from "../lib/shareApi";
import { exportProject } from "../lib/exportProject";
import Logo from "./Logo";
import SettingsPanel from "./SettingsPanel";
import DiffDialog from "./DiffDialog";

type ShareState = "idle" | "saving" | "copied" | "error";

export default function Header() {
  const { reset, parentSlug, forkedFrom } = useProject();
  const addMine = useMine((s) => s.add);
  const [state, setState] = useState<ShareState>("idle");
  const [message, setMessage] = useState("");
  const [same, setSame] = useState(false);
  const [diffing, setDiffing] = useState(false);

  const share = async () => {
    const { html, css, js, tailwind, resources, parentSlug } = useProject.getState();
    setState("saving");
    try {
      if (canShare) {
        const { slug, existing } = await shareProject({ html, css, js, tailwind, resources }, parentSlug);
        if (!existing) useProject.setState({ parentSlug: slug, forkedFrom: parentSlug });
        else useProject.setState({ parentSlug: slug });
        setSame(existing);
        addMine({ slug, html, css, js, tailwind, resources, title: titleFromHtml(html), createdAt: Date.now() });
        history.replaceState(null, "", `/p/${slug}`);
      } else {
        history.replaceState(null, "", encodeShare({ html, css, js, tailwind, resources }));
      }
    } catch (e) {
      setMessage(e instanceof ShareError ? e.message : "Couldn't share this project. Try again.");
      setState("error");
      setTimeout(() => setState("idle"), 5000);
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
  const label = { idle: "Share", saving: "Saving…", copied: same ? "Same link copied" : "Link copied", error: "Couldn't share" }[state];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-4">
      <div className="flex min-w-0 items-center gap-4">
        <Logo onDark />
        {parentSlug && (
          <span className="hidden min-w-0 items-center gap-1.5 truncate rounded-full bg-bed px-3 py-1 font-mono text-xs text-fade md:flex" title="The link to this project">
            <GitFork size={12} aria-hidden />
            {forkedFrom ? (
              <>forked from <Link className="text-css underline" to={`/p/${forkedFrom}`}>/p/{forkedFrom}</Link></>
            ) : (
              <>/p/{parentSlug}</>
            )}
          </span>
        )}
      </div>
      <nav className="flex items-center" aria-label="Editor">
        <SettingsPanel />
        <button className={link} onClick={() => { reset(); history.replaceState(null, "", "/new"); }}>
          <FilePlus2 size={16} aria-hidden /> <span className="hidden sm:inline">New</span>
        </button>
        {parentSlug && canShare && (
          <button className={link} onClick={() => setDiffing(true)} title="See what you changed since this link">
            <GitCompareArrows size={16} aria-hidden /> <span className="hidden lg:inline">Changes</span>
          </button>
        )}
        <button className={link} onClick={() => exportProject(useProject.getState())} title="Download as a small static project">
          <Download size={16} aria-hidden /> <span className="hidden lg:inline">Export</span>
        </button>
        <Link className={link} to="/gallery"><LayoutGrid size={16} aria-hidden /> <span className="hidden lg:inline">Templates</span></Link>
        <Link className={link} to="/mine"><FolderOpen size={16} aria-hidden /> <span className="hidden lg:inline">My work</span></Link>
        <button
          onClick={share}
          disabled={state === "saving"}
          className="ml-2 flex items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-sm font-bold text-ink transition hover:shadow-[0_0_0_4px_rgb(123_97_255_/_0.45)] disabled:opacity-60"
        >
          {state === "copied" ? <Check size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
          {label}
        </button>
      </nav>
      {diffing && <DiffDialog onClose={() => setDiffing(false)} />}
      <span className="sr-only" role="status">{state === "copied" ? "Link copied to clipboard" : state === "error" ? message : ""}</span>
      {state === "error" && (
        <p className="absolute right-4 top-14 z-20 max-w-xs rounded-lg bg-danger px-3 py-2 text-sm font-semibold text-ink shadow-lg" role="alert">{message}</p>
      )}
    </header>
  );
}
