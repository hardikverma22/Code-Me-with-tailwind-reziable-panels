import { useRef } from "react";
import { Link } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import TemplateThumb from "../../components/TemplateThumb";
import { templates } from "../../lib/templates";

gsap.registerPlugin(ScrollTrigger);

/** Templates on a horizontal track that scrolls as you scroll down. */
export default function Rail() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const dist = () => (track.current?.scrollWidth ?? 0) - window.innerWidth + 120;
        gsap.to(track.current, {
          x: () => -dist(), ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${dist()}`, pin: true, scrub: 0.5, invalidateOnRefresh: true, anticipatePin: 1 },
        });
        gsap.utils.toArray<HTMLElement>(".rail-card").forEach((card, i) => {
          gsap.fromTo(card.querySelector(".rail-thumb"), { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, containerAnimation: undefined, start: "left right", end: "left 30%", scrub: true, horizontal: false } });
          gsap.set(card, { y: i % 2 ? 36 : 0 });
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="on-dark relative flex min-h-dvh flex-col justify-center overflow-hidden bg-bench py-20 text-paper">
      <div className="mx-auto flex w-full max-w-[1480px] flex-wrap items-end justify-between gap-4 px-5 md:px-10">
        <h2 className="display max-w-[14ch] text-[clamp(2.4rem,5vw,4.5rem)]">Start from something that runs.</h2>
        <Link to="/gallery" className="flex items-center gap-1.5 text-lg font-semibold">All {templates.length} templates <ArrowUpRight size={20} aria-hidden /></Link>
      </div>
      <div ref={track} className="mt-12 flex gap-8 overflow-x-auto px-5 pb-6 md:px-10 lg:overflow-visible lg:pr-[120px]">
        {templates.map((t) => (
          <Link key={t.id} to={`/new?template=${t.id}`} className="rail-card group block w-[78vw] shrink-0 text-paper no-underline sm:w-[46vw] lg:w-[34vw] lg:max-w-[560px]" data-cursor>
            <div className="overflow-hidden rounded-2xl">
              <div className="rail-thumb"><TemplateThumb sources={t} title={t.title} /></div>
            </div>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-2xl font-extrabold tracking-tight">{t.title}</p>
                <p className="mt-1 max-w-[40ch] text-paper/70">{t.blurb}</p>
              </div>
              <ArrowUpRight className="mt-1 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1" size={26} aria-hidden />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
