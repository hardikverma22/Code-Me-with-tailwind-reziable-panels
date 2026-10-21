import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import SiteNav from "../../components/SiteNav";
import FlowField from "../../fx/FlowField";
import KineticText from "../../fx/KineticText";
import Magnetic from "../../fx/Magnetic";
import Marquee from "../../fx/Marquee";
import HeroStage from "./HeroStage";

const words = ["HTML", "CSS", "JavaScript", "Emmet", "Prettier", "Live console", "Accessibility checks", "Verified fixes", "On-device AI", "Short links", "Forks", "Templates"];

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
      <SiteNav onDark cta={false} />
      <div className="relative mx-auto grid w-full max-w-[1480px] flex-1 items-center gap-10 px-5 pb-10 pt-4 md:px-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <KineticText ready={ready} lines={["Write code.", "Watch it", "come alive."]} className="text-[clamp(3.2rem,8.6vw,8.6rem)]" />
          <div className="mt-10 max-w-[44ch]">
            <p className="h-fade text-xl leading-snug text-paper/80">
              A free playground for HTML, CSS and JavaScript. No account. It checks your page as you go, and proves a fix before you accept it.
            </p>
            <div className="h-fade mt-8">
              <Magnetic>
                <button onClick={() => navigate("/new")} className="group flex items-center gap-2 rounded-full bg-paper px-8 py-4 text-lg font-bold text-ink">
                  Start coding <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
                </button>
              </Magnetic>
            </div>
          </div>
        </div>
        <div className="mt-8 lg:col-span-5 lg:mt-0"><HeroStage ready={ready} /></div>
      </div>
      <Marquee words={words} className="relative border-t border-paper/10 py-4 text-sm font-semibold uppercase tracking-widest text-fade" />
    </section>
  );
}
