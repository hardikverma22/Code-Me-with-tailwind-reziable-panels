import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const blobs = [
  { c: "bg-violet", cls: "-left-24 -top-32 size-[520px]", dx: 90, dy: 60, d: 14 },
  { c: "bg-coral", cls: "right-[-120px] top-10 size-[460px]", dx: -80, dy: 90, d: 17 },
  { c: "bg-aqua", cls: "left-[35%] top-[45%] size-[420px]", dx: 70, dy: -70, d: 19 },
];

/** A slow, drifting aurora behind the front-door sections. Still under reduced motion. */
export default function Aurora({ strength = 1, fade = true }: { strength?: number; fade?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>(".aurora-blob", root.current).forEach((el, i) => {
          gsap.to(el, { x: blobs[i].dx, y: blobs[i].dy, duration: blobs[i].d, ease: "sine.inOut", repeat: -1, yoyo: true });
        });
      });
    },
    { scope: root }
  );
  return (
    <div ref={root} className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: strength, ...(fade ? { maskImage: "linear-gradient(to bottom, black 55%, transparent 100%)" } : {}) }} aria-hidden>
      {blobs.map((b, i) => (
        <div key={i} className={`aurora-blob ${b.c} ${b.cls}`} />
      ))}
    </div>
  );
}
