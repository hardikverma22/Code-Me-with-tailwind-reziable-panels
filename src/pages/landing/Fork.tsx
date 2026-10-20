import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const nodes = [
  { id: "r", x: 90, y: 210, label: "/p/x7k2m9qa", c: "#ff8a6b" },
  { id: "a", x: 420, y: 100, label: "/p/q3n8d2hz", c: "#4fd8f0" },
  { id: "b", x: 420, y: 320, label: "/p/m4w9t6ke", c: "#a99bff" },
  { id: "a1", x: 760, y: 50, label: "/p/c8r5v2pn", c: "#4fd8f0" },
  { id: "a2", x: 760, y: 160, label: "/p/h2j7s4ub", c: "#4fd8f0" },
  { id: "b1", x: 760, y: 280, label: "/p/f6y3g9ds", c: "#a99bff" },
  { id: "b2", x: 760, y: 380, label: "/p/z5k1x8wa", c: "#a99bff" },
];
const edges = [["r", "a"], ["r", "b"], ["a", "a1"], ["a", "a2"], ["b", "b1"], ["b", "b2"]];
const at = (id: string) => nodes.find((n) => n.id === id)!;

/** A fork tree that draws itself while you scroll through it. */
export default function Fork() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const paths = gsap.utils.toArray<SVGPathElement>(".edge");
        paths.forEach((p) => { const len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len }); });
        gsap.set(".node", { scale: 0, transformOrigin: "50% 50%" });
        gsap.set(".node-label", { opacity: 0 });
        const tl = gsap.timeline({ scrollTrigger: { trigger: root.current, start: "top 65%", end: "bottom 70%", scrub: 0.6 }, defaults: { ease: "power2.out" } });
        tl.to(".node-r", { scale: 1, duration: 0.5 }).to(".label-r", { opacity: 1, duration: 0.3 }, "<")
          .to(".edge-0, .edge-1", { strokeDashoffset: 0, duration: 1 }).to(".node-a, .node-b", { scale: 1, duration: 0.4 }, "-=0.3").to(".label-a, .label-b", { opacity: 1, duration: 0.3 }, "<")
          .to(".edge-2, .edge-3, .edge-4, .edge-5", { strokeDashoffset: 0, duration: 1 }).to(".node-a1, .node-a2, .node-b1, .node-b2", { scale: 1, duration: 0.4, stagger: 0.08 }, "-=0.3").to(".label-a1, .label-a2, .label-b1, .label-b2", { opacity: 1, duration: 0.3 }, "<");
      });
      mm.add("(prefers-reduced-motion: reduce)", () => { gsap.set(".edge", { strokeDasharray: 0 }); });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="on-dark relative overflow-hidden bg-bench py-28 text-paper lg:py-40">
      <div className="mx-auto grid max-w-[1480px] items-center gap-12 px-5 md:px-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="display text-[clamp(2.4rem,5vw,4.5rem)]">A link is the whole project.</h2>
          <p className="mt-6 max-w-[40ch] text-xl leading-relaxed text-paper/75">
            Share saves your code behind a short link. Open someone's link, change it, and Share again: you get your own copy, and the original never changes.
          </p>
        </div>
        <div className="lg:col-span-7">
          <svg viewBox="0 0 900 430" className="h-auto w-full" role="img" aria-label="One shared project forked into two copies, each forked again">
            {edges.map(([a, b], i) => {
              const A = at(a), B = at(b);
              const mx = (A.x + B.x) / 2;
              return <path key={i} className={`edge edge-${i}`} d={`M${A.x} ${A.y} C ${mx} ${A.y}, ${mx} ${B.y}, ${B.x} ${B.y}`} fill="none" stroke={B.c} strokeWidth="2.5" strokeLinecap="round" />;
            })}
            {nodes.map((n) => (
              <g key={n.id}>
                <circle className={`node node-${n.id}`} cx={n.x} cy={n.y} r={n.id === "r" ? 16 : 11} fill={n.c} />
                <text className={`node-label label-${n.id}`} x={n.x + (n.id === "r" ? -6 : 20)} y={n.y + (n.id === "r" ? 40 : 5)} fill="#f1f0ff" fontSize="15" fontFamily="JetBrains Mono, monospace" textAnchor={n.id === "r" ? "start" : "start"}>{n.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}
