import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { MousePointer2 } from "lucide-react";
import { tokenize } from "../../lib/highlight";

const lines = [
  "button {",
  "  background: #7b61ff;",
  "  color: white;",
  "  border-radius: 999px;",
  "  padding: 14px 28px;",
  "}",
];
const tokenized = lines.map((l) => tokenize(l, "css"));
const chips = [
  { text: "Emmet  ul>li*3", cls: "left-[6%] top-[-3%] text-html", depth: 40 },
  { text: "Prettier  ✓ formatted", cls: "right-[-2%] top-[2%] text-js", depth: 70 },
  { text: "/p/x7k2m9qa", cls: "right-[-6%] bottom-[30%] text-css font-mono", depth: 55 },
  { text: "▸ Pressed 3 times", cls: "left-[2%] bottom-[-3%] text-lemon font-mono", depth: 85 },
];

/** The hero's live stage: code types itself, the result builds, and the whole thing tilts toward the pointer. */
export default function HeroStage({ ready }: { ready: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rows = gsap.utils.toArray<HTMLElement>(".st-row", root.current);
      const btn = ".st-btn";
      const finalStyle = { backgroundColor: "#7b61ff", color: "#fff", borderRadius: 999, paddingLeft: 28, paddingRight: 28, paddingTop: 14, paddingBottom: 14, borderWidth: 0 };
      const reset = () => {
        gsap.set(rows, { opacity: 0 });
        gsap.set(btn, { backgroundColor: "#e4e4e7", color: "#000", borderRadius: 3, paddingLeft: 8, paddingRight: 8, paddingTop: 3, paddingBottom: 3, borderWidth: 1, scale: 1 });
        gsap.set(".st-count", { opacity: 0 });
        gsap.set(".st-cursor", { opacity: 0, x: 80, y: 60 });
      };
      reset();
      if (reduced) { gsap.set(rows, { opacity: 1 }); gsap.set(btn, finalStyle); return; }
      if (!ready) return;

      gsap.from(".st-win", { opacity: 0, y: 60, rotateX: 18, duration: 1.3, ease: "expo.out", stagger: 0.14, delay: 0.5 });
      gsap.from(".st-chip", { opacity: 0, scale: 0.6, duration: 0.9, ease: "back.out(2)", stagger: 0.12, delay: 1.1 });
      gsap.utils.toArray<HTMLElement>(".st-chip").forEach((c, i) => gsap.to(c, { y: i % 2 ? 12 : -12, duration: 2.6 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true }));

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, delay: 1.2, onRepeat: reset });
      rows.forEach((row, i) => {
        tl.to(row, { opacity: 1, duration: 0.35, ease: "none" }, i * 0.55 + 0.1);
        const style = [null, { backgroundColor: "#7b61ff", borderColor: "#7b61ff" }, { color: "#fff" }, { borderRadius: 999 }, { paddingLeft: 28, paddingRight: 28, paddingTop: 14, paddingBottom: 14 }, null][i];
        if (style) tl.to(btn, { ...style, duration: 0.45, ease: "power2.out" }, i * 0.55 + 0.35);
      });
      const clickAt = 3.9;
      tl.to(".st-cursor", { opacity: 1, x: 0, y: 0, duration: 0.7, ease: "power2.out" }, clickAt - 0.7);
      [0, 0.7, 1.4].forEach((d, k) => {
        tl.fromTo(btn, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: "back.out(3)" }, clickAt + d)
          .call(() => { const el = root.current?.querySelector(".st-count"); if (el) el.textContent = `Pressed ${k + 1} times`; }, [], clickAt + d)
          .to(".st-count", { opacity: 1, duration: 0.2 }, clickAt + d);
      });
      tl.to({}, { duration: 1.2 });

      // tilt toward the pointer, each layer at its own depth
      const rx = gsap.quickTo(".st-tilt", "rotateX", { duration: 0.8, ease: "power3" });
      const ry = gsap.quickTo(".st-tilt", "rotateY", { duration: 0.8, ease: "power3" });
      const move = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        ry(nx * 14); rx(-ny * 12);
      };
      window.addEventListener("pointermove", move);
      return () => { window.removeEventListener("pointermove", move); tl.kill(); };
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <div ref={root} className="relative mx-auto h-[480px] w-full max-w-[560px] lg:h-[600px]" style={{ perspective: "1400px" }}>
      <div className="st-tilt relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
        <div className="st-win lift absolute left-0 top-[6%] w-[88%] overflow-hidden rounded-2xl bg-bed" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-1.5 px-4 pt-3.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-html" /><span className="size-2.5 rounded-full bg-css" /><span className="size-2.5 rounded-full bg-js" />
            <span className="ml-3 font-mono text-xs text-fade">style.css</span>
          </div>
          <pre className="m-0 px-5 pb-6 pt-4 font-mono text-[13.5px] leading-7" aria-label="CSS being typed">
            {tokenized.map((toks, i) => (
              <span key={i} className="st-row block opacity-0">
                {toks.map((tk, j) => <span key={j} className={tk.c}>{tk.t}</span>)}
                {"​"}
              </span>
            ))}
          </pre>
        </div>

        <div className="st-win lift absolute bottom-[4%] right-0 grid h-[44%] w-[74%] place-items-center overflow-hidden rounded-2xl bg-white" style={{ transform: "translateZ(70px)" }}>
          <div className="text-center">
            <p className="m-0 text-2xl font-extrabold tracking-tight text-ink">Hello, CodeMe</p>
            <button className="st-btn mt-3 border border-black/50 bg-zinc-200 px-2 py-0.5 text-[15px] font-semibold text-black" tabIndex={-1}>Press me</button>
            <p className="st-count mt-3 font-mono text-sm text-muted opacity-0">Pressed 1 times</p>
          </div>
          <MousePointer2 className="st-cursor pointer-events-none absolute left-1/2 top-[58%] fill-ink text-white" size={28} aria-hidden />
        </div>

        {chips.map((c) => (
          <div key={c.text} className={`st-chip absolute rounded-full border border-paper/15 bg-bench/80 px-4 py-2 text-sm font-semibold backdrop-blur-sm ${c.cls}`} style={{ transform: `translateZ(${c.depth + 60}px)` }}>
            {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}
