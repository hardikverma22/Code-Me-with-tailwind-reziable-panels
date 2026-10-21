import { Link, useNavigate } from "react-router";
import Logo from "./Logo";

/** `cta` is the "Open editor" button. A page that already has its own primary action leaves it out. */
export default function SiteNav({ onDark = false, cta = true }: { onDark?: boolean; cta?: boolean }) {
  const navigate = useNavigate();
  const link = `whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold no-underline transition-colors sm:px-4 ${
    onDark ? "text-paper/80 hover:text-paper" : "text-muted hover:text-ink"
  }`;
  return (
    <header className="relative z-10 mx-auto flex w-full max-w-[1480px] items-center justify-between px-5 py-5 md:px-10">
      <Logo onDark={onDark} />
      <nav className="flex items-center gap-1" aria-label="Main">
        <Link to="/gallery" className={link}>Templates</Link>
        <Link to="/mine" className={link}>My work</Link>
        {!cta && <a href="https://github.com/hardikverma22/code-me" className={link}>Source</a>}
        {cta && <button
          onClick={() => navigate("/new")}
          className={`ml-1 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition hover:shadow-[0_0_0_4px_rgb(123_97_255_/_0.28)] ${
            onDark ? "bg-paper text-ink" : "bg-ink text-white"
          }`}
        >
          Open editor
        </button>}
      </nav>
    </header>
  );
}
