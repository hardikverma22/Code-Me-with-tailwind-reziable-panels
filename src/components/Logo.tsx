import { Link } from "react-router";

/** The CodeMe mark: three overlapping dots (HTML, CSS, JS). Fixed colours, identical everywhere. */
export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <circle cx="12" cy="13" r="9" fill="#ff7351" />
      <circle cx="21" cy="13" r="9" fill="#22c7e6" fillOpacity="0.92" />
      <circle cx="16.5" cy="21" r="9" fill="#7b61ff" fillOpacity="0.92" />
    </svg>
  );
}

export default function Logo({ onDark = false }: { onDark?: boolean }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 no-underline ${onDark ? "text-paper" : "text-ink"}`} aria-label="CodeMe home">
      <LogoMark />
      <span className="text-xl font-extrabold tracking-tight">CodeMe</span>
    </Link>
  );
}
