import { Link } from "react-router";

/** A small prism mark and a tight wordmark. */
export default function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 no-underline ${onDark ? "text-paper" : "text-ink"}`} aria-label="CodeMe home">
      <span className="relative block size-7 overflow-hidden rounded-[9px]" aria-hidden>
        <span className="absolute -left-2 -top-2 size-6 rounded-full bg-coral" />
        <span className="absolute -bottom-2 -right-1 size-6 rounded-full bg-violet" />
        <span className="absolute left-2 top-2 size-5 rounded-full bg-aqua mix-blend-multiply" />
      </span>
      <span className="text-xl font-extrabold tracking-tight">CodeMe</span>
    </Link>
  );
}
