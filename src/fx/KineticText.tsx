import { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText);

type Props = { lines: string[]; ready: boolean; className?: string };

/** Headline whose letters rise in, then lift and warm toward the pointer. */
export default function KineticText({ lines, ready, className = "" }: Props) {
  const root = useRef<HTMLHeadingElement>(null);
  const chars = useRef<HTMLElement[]>([]);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const split = new SplitText(".kt-line", { type: "chars", charsClass: "kt-char" });
      chars.current = split.chars as HTMLElement[];
      gsap.set(split.chars, { display: "inline-block", willChange: "transform" });
      if (reduced) return;
      gsap.set(split.chars, { yPercent: 115, rotate: 8, opacity: 0 });
      if (ready) {
        gsap.to(split.chars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.2, ease: "expo.out", stagger: { each: 0.028, from: "start" } });
      }
      return () => split.revert();
    },
    { scope: root, dependencies: [ready] }
  );

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      for (const c of chars.current) {
        const r = c.getBoundingClientRect();
        const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
        const k = Math.max(0, 1 - d / 190);
        gsap.to(c, { y: -k * 14, color: k > 0.35 ? "#4fd8f0" : "#f1f0ff", duration: 0.35, ease: "power3.out", overwrite: "auto" });
      }
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <h1 ref={root} className={`display ${className}`} aria-label={lines.join(" ")}>
      {lines.map((l) => (
        <span key={l} className="-mb-[0.06em] block overflow-hidden pb-[0.14em]" aria-hidden>
          <span className="kt-line block">{l}</span>
        </span>
      ))}
    </h1>
  );
}
