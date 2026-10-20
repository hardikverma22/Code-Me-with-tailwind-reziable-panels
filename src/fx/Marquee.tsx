/** An endless ribbon of words. Pure CSS so it never costs a frame of JS. */
export default function Marquee({ words, className = "" }: { words: string[]; className?: string }) {
  const row = (
    <ul className="marquee-row flex shrink-0 items-center gap-10 pr-10" aria-hidden>
      {words.map((w, i) => (
        <li key={i} className="flex items-center gap-10 whitespace-nowrap">
          {w}
          <span className="size-2 rounded-full bg-current opacity-40" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`flex overflow-hidden ${className}`}>
      {row}
      {row}
    </div>
  );
}
