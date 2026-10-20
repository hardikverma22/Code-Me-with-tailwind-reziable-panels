import { useEffect, useRef } from "react";
import gsap from "gsap";
import { LogoMark } from "../components/Logo";

/** A short counter-and-curtain intro, shown once per session. */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const num = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: onDone });
    tl.to(counter, { v: 100, duration: 1.3, ease: "power2.inOut", onUpdate: () => { if (num.current) num.current.textContent = String(Math.round(counter.v)); } })
      .to(".pl-word", { yPercent: -110, duration: 0.5, ease: "power3.in" }, "+=0.1")
      .to(root.current, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "-=0.2");
    return () => { tl.kill(); };
  }, [onDone]);

  return (
    <div ref={root} className="fixed inset-0 z-[90] grid place-items-center bg-bench text-paper" style={{ clipPath: "inset(0 0 0% 0)" }} role="status" aria-label="Loading">
      <div className="overflow-hidden">
        <p className="pl-word flex items-center gap-4 display text-[clamp(3rem,10vw,8rem)]"><LogoMark size={96} />CodeMe</p>
      </div>
      <span ref={num} className="tnum absolute bottom-8 right-8 font-mono text-sm text-fade">0</span>
    </div>
  );
}
