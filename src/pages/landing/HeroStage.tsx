import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Check, MousePointer2, ShieldCheck, type LucideIcon } from "lucide-react";
import { tokenize } from "../../lib/highlight";

const lines = [
  ".plan {",
  "  background: white;",
  "  padding: 28px;",
  "  border-radius: 24px;",
  "}",
  ".price { font-size: 40px; }",
  "button { background: #6c4fff; color: #fff; border-radius: 99px; }",
  "body { background: #1d1d3c; }",
];
const tokenized = lines.map((l) => tokenize(l, "css"));

type Chip = { text: string; cls: string; depth: number; Icon?: LucideIcon };
const chips: Chip[] = [
  { text: "Emmet  ul>li*3", cls: "left-[6%] top-[-3%] text-html", depth: 40 },
  { text: "Prettier formatted", cls: "right-[-2%] top-[2%] text-js", depth: 70, Icon: Check },
  { text: "/p/x7k2m9qa", cls: "right-[-6%] bottom-[34%] text-css font-mono", depth: 55 },
  { text: "Fix checked in a sandbox", cls: "left-[2%] bottom-[-3%] text-lemon", depth: 85, Icon: ShieldCheck },
];

/** What each typed line does to the page beside it, in the order the lines appear. */
const effects: (null | { target: string; vars: gsap.TweenVars })[] = [
  null,
  { target: ".st-card", vars: { backgroundColor: "#ffffff" } },
  { target: ".st-card", vars: { padding: 28 } },
  { target: ".st-card", vars: { borderRadius: 24 } },
  null,
  { target: ".st-price", vars: { fontSize: 40, fontWeight: 800 } },
  { target: ".st-btn", vars: { backgroundColor: "#6c4fff", color: "#ffffff", borderRadius: 999, paddingLeft: 20, paddingRight: 20, paddingTop: 9, paddingBottom: 9, borderWidth: 0 } },
  { target: ".st-scene", vars: { backgroundColor: "#1d1d3c" } },
];

/** The hero's live stage: CSS types itself, the plan card takes shape, then a click makes the page respond. */
export default function HeroStage({ ready }: { ready: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rows = gsap.utils.toArray<HTMLElement>(".st-row", root.current);
      const check = root.current?.querySelector<HTMLInputElement>(".st-check");
      const amount = root.current?.querySelector<HTMLElement>(".st-amount");

      const finish = () => { for (const e of effects) if (e) gsap.set(e.target, e.vars); };
      const setSwitch = (on: boolean) => {
        if (check) check.checked = on;
        if (amount) amount.textContent = on ? "$9" : "$12";
        gsap.set(".st-save", { opacity: on ? 1 : 0 });
      };
      const reset = () => {
        gsap.set(rows, { opacity: 0 });
        gsap.set(".st-scene", { backgroundColor: "#ffffff" });
        gsap.set(".st-card", { backgroundColor: "rgba(255,255,255,0)", padding: 0, borderRadius: 0 });
        gsap.set(".st-price", { fontSize: 16, fontWeight: 400 });
        gsap.set(".st-btn", { backgroundColor: "#e4e4e7", color: "#000000", borderRadius: 3, paddingLeft: 8, paddingRight: 8, paddingTop: 2, paddingBottom: 2, borderWidth: 1, scale: 1 });
        gsap.set(".st-cursor", { opacity: 0, x: 70, y: 50 });
        setSwitch(false);
      };
      reset();
      if (reduced) { gsap.set(rows, { opacity: 1 }); finish(); setSwitch(true); return; }
      if (!ready) return;

      gsap.from(".st-win", { opacity: 0, y: 60, rotateX: 18, duration: 1.3, ease: "expo.out", stagger: 0.14, delay: 0.5 });
      gsap.from(".st-chip", { opacity: 0, scale: 0.6, duration: 0.9, ease: "back.out(2)", stagger: 0.12, delay: 1.1 });
      gsap.utils.toArray<HTMLElement>(".st-chip").forEach((c, i) => gsap.to(c, { y: i % 2 ? 12 : -12, duration: 2.6 + i * 0.4, ease: "sine.inOut", repeat: -1, yoyo: true }));

      const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, delay: 1.2, onRepeat: reset });
      rows.forEach((row, i) => {
        tl.to(row, { opacity: 1, duration: 0.3, ease: "none" }, i * 0.5 + 0.1);
        const fx = effects[i];
        if (fx) tl.to(fx.target, { ...fx.vars, duration: 0.45, ease: "power2.out" }, i * 0.5 + 0.35);
      });
      // then the page responds: a click flips the yearly switch and the price follows
      const clickAt = rows.length * 0.5 + 0.9;
      tl.to(".st-cursor", { opacity: 1, x: 0, y: 0, duration: 0.7, ease: "power2.out" }, clickAt - 0.7)
        .call(() => setSwitch(true), [], clickAt)
        .fromTo(".st-amount", { scale: 1.35 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }, clickAt)
        .fromTo(".st-cursor", { scale: 0.85 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }, clickAt)
        .to({}, { duration: 2 });

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
        <div className="st-win lift absolute left-0 top-[4%] w-[94%] overflow-hidden rounded-2xl bg-bed" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-1.5 px-4 pt-3.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-html" /><span className="size-2.5 rounded-full bg-css" /><span className="size-2.5 rounded-full bg-js" />
            <span className="ml-3 font-mono text-xs text-fade">style.css</span>
          </div>
          <pre className="m-0 px-5 pb-5 pt-3 font-mono text-[12.5px] leading-6" aria-label="CSS being typed">
            {tokenized.map((toks, i) => (
              <span key={i} className="st-row block whitespace-pre opacity-0">
                {toks.map((tk, j) => <span key={j} className={tk.c}>{tk.t}</span>)}
                {"​"}
              </span>
            ))}
          </pre>
        </div>

        <div className="st-win lift st-scene absolute bottom-[5%] right-0 grid h-[42%] w-[72%] place-items-center overflow-hidden rounded-2xl bg-white" style={{ transform: "translateZ(70px)", fontFamily: "'Times New Roman', serif" }} aria-hidden>
          <div className="st-card text-black">
            <p className="m-0 text-[16px] font-bold">Pro</p>
            <p className="st-price m-0 text-[16px]"><span className="st-amount inline-block">$12</span> / month</p>
            <label className="relative my-1 flex items-center gap-1.5 text-[14px]">
              <input type="checkbox" className="st-check accent-violet" tabIndex={-1} readOnly />
              Pay yearly
              <MousePointer2 className="st-cursor pointer-events-none absolute -left-1 top-2 fill-ink text-white" size={24} />
            </label>
            <p className="st-save m-0 text-[12px] text-muted" style={{ opacity: 0 }}>You save 25%</p>
            <button className="st-btn mt-1.5 border border-black/50 bg-zinc-200 px-2 py-0.5 text-[14px] text-black" tabIndex={-1}>Choose Pro</button>
          </div>
        </div>

        {chips.map((c) => (
          <div key={c.text} className={`st-chip absolute flex items-center gap-1.5 rounded-full border border-paper/15 bg-bench px-4 py-2 text-sm font-semibold ${c.cls}`} style={{ transform: `translateZ(${c.depth + 60}px)` }}>
            {c.Icon && <c.Icon size={14} aria-hidden />}
            {c.text}
          </div>
        ))}
      </div>
    </div>
  );
}
