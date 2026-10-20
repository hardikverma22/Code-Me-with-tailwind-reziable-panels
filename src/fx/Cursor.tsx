import { useEffect, useRef } from "react";
import gsap from "gsap";

/** A ring that follows the pointer and swells over anything interactive. Fine pointers only. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = ring.current;
    if (!fine || reduced || !el) return;

    document.documentElement.classList.add("has-cursor");
    const x = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3" });
    const y = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3" });
    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0 });

    const move = (e: PointerEvent) => {
      x(e.clientX);
      y(e.clientY);
      gsap.to(el, { opacity: 1, duration: 0.2, overwrite: "auto" });
      const hot = (e.target as HTMLElement | null)?.closest("a, button, [data-cursor]");
      gsap.to(el, { scale: hot ? 2.4 : 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
    };
    const leave = () => gsap.to(el, { opacity: 0, duration: 0.2 });
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div
      ref={ring}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] size-9 rounded-full border-2 border-white mix-blend-difference"
    />
  );
}
