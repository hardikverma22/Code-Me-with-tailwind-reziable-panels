import { Link, useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import SiteNav from "../../components/SiteNav";
import FlowField from "../../fx/FlowField";
import KineticText from "../../fx/KineticText";
import Magnetic from "../../fx/Magnetic";
import Marquee from "../../fx/Marquee";

const words = ["HTML", "CSS", "JavaScript", "Emmet", "Prettier", "Live console", "Short links", "Forks", "Templates"];

export default function Hero({ ready }: { ready: boolean }) {
  const navigate = useNavigate();
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!ready || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.from(".h-fade", { opacity: 0, y: 24, duration: 1, ease: "expo.out", stagger: 0.1, delay: 0.55 });
      gsap.to(".scroll-tick", { y: 10, opacity: 0.2, duration: 1.1, ease: "sine.inOut", repeat: -1, yoyo: true });
    },
    { scope: root, dependencies: [ready] }
  );

  return (
    <section ref={root} className="on-dark relative flex min-h-dvh flex-col overflow-hidden bg-bench text-paper">
      <FlowField />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_55%,rgb(11_11_26_/_0.75),transparent_65%)]" aria-hidden />
      <SiteNav onDark />
      <div className="relative mx-auto flex w-full max-w-[1480px] flex-1 flex-col justify-center px-5 pb-10 pt-4 md:px-10">
        <KineticText ready={ready} lines={["Write code.", "Watch it", "come alive."]} className="text-[clamp(3.4rem,12.5vw,11.5rem)]" />
        <div className="mt-10 flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-[40ch]">
            <p className="h-fade text-xl leading-snug text-paper/80">
              A free playground for HTML, CSS and JavaScript. No account. Every Share is a link anyone can open and fork.
            </p>
            <div className="h-fade mt-8 flex flex-wrap items-center gap-7">
              <Magnetic>
                <button onClick={() => navigate("/new")} className="group flex items-center gap-2 rounded-full bg-paper px-8 py-4 text-lg font-bold text-ink">
                  Start coding <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              </Magnetic>
              <Link to="/gallery" className="text-lg font-semibold text-paper underline decoration-paper/30 hover:decoration-paper">Browse templates</Link>
            </div>
          </div>
          <div className="h-fade hidden items-center gap-3 text-sm font-semibold text-fade md:flex" aria-hidden>
            <span className="relative block h-12 w-px bg-fade/40"><span className="scroll-tick absolute left-[-1.5px] top-0 block size-1 rounded-full bg-paper" /></span>
            Scroll
          </div>
        </div>
      </div>
      <Marquee words={words} className="relative border-t border-paper/10 py-4 text-sm font-semibold uppercase tracking-widest text-fade" />
    </section>
  );
}
