import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MousePointer2 } from "lucide-react";
import { tokenize } from "../../lib/highlight";
import { builtPlan } from "./example";

gsap.registerPlugin(ScrollTrigger);

const code = builtPlan;

type Lang = keyof typeof code;
const langs: Lang[] = ["html", "css", "js"];
const dot: Record<Lang, string> = { html: "bg-html", css: "bg-css", js: "bg-js" };
const tokens = { html: tokenize(code.html, "html"), css: tokenize(code.css, "css"), js: tokenize(code.js, "js") };
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** A pinned sequence: code types itself while the real page assembles beside it. */
export default function Build() {
  const root = useRef<HTMLElement>(null);
  const spans = useRef<Record<Lang, HTMLElement[]>>({ html: [], css: [], js: [] });
  const shown = useRef<Record<Lang, number>>({ html: 0, css: 0, js: 0 });
  const [tab, setTab] = useState<Lang>("html");

  const reveal = (lang: Lang, n: number) => {
    const els = spans.current[lang];
    const from = Math.min(shown.current[lang], n), to = Math.max(shown.current[lang], n);
    for (let i = from; i < to; i++) if (els[i]) els[i].style.opacity = i < n ? "1" : "0";
    els.forEach((e, i) => { if (e) e.style.boxShadow = n > 0 && i === n - 1 ? "2px 0 0 #4fd8f0" : "none"; });
    shown.current[lang] = n;
  };

  const sync = (p: number) => {
    const h = clamp01(p / 0.31), c = clamp01((p - 0.35) / 0.28), j = clamp01((p - 0.68) / 0.26);
    reveal("html", Math.round(h * code.html.length));
    reveal("css", Math.round(c * code.css.length));
    reveal("js", Math.round(j * code.js.length));
    setTab(p < 0.33 ? "html" : p < 0.66 ? "css" : "js");
    gsap.set(".bar-fill", { scaleX: p });
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const build = () => {
        const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });
        // HTML: the elements appear, unstyled
        tl.fromTo(".b-h", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.08)
          .fromTo(".b-price", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.14)
          .fromTo(".b-switch", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.2)
          .fromTo(".b-btn-wrap", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.26)
          // CSS: the card gets its look, line by line, and the dark page lands last
          .to(".b-card", { backgroundColor: "#ffffff", padding: 32, borderRadius: 24, boxShadow: "0 30px 60px rgba(0,0,0,0.4)", duration: 0.06 }, 0.38)
          .to(".b-h", { fontSize: 20, color: "#565878", duration: 0.04 }, 0.45)
          .set(".b-card", { fontFamily: "Bricolage Grotesque, system-ui, sans-serif" }, 0.45)
          .to(".b-price", { fontSize: 40, fontWeight: 800, duration: 0.04 }, 0.5)
          .set(".b-check", { accentColor: "#6c4fff" }, 0.54)
          .to(".b-btn", { backgroundColor: "#6c4fff", color: "#fff", borderRadius: 999, paddingLeft: 20, paddingRight: 20, paddingTop: 10, paddingBottom: 10, borderWidth: 0, duration: 0.05 }, 0.58)
          .to(".b-scene", { backgroundColor: "#1d1d3c", duration: 0.05 }, 0.62)
          // JS: it responds. A cursor arrives and the switch flips, and the price follows.
          .fromTo(".b-cursor", { opacity: 0, x: 90, y: 70 }, { opacity: 1, x: 0, y: 0, duration: 0.08, ease: "power2.out" }, 0.68);
        const sw = { t: 0 };
        const setOn = (on: boolean) => {
          const box = root.current?.querySelector<HTMLInputElement>(".b-check");
          const amount = root.current?.querySelector<HTMLElement>(".b-amount");
          if (box) box.checked = on;
          if (amount) amount.textContent = on ? "$9" : "$12";
        };
        // Driven by progress, not by a one-shot callback, so scrubbing backwards undoes it.
        tl.to(sw, { t: 1, duration: 0.02, onUpdate: () => setOn(sw.t > 0.5) }, 0.8)
          .fromTo(".b-amount", { scale: 1.4 }, { scale: 1, duration: 0.06, ease: "back.out(3)", immediateRender: false }, 0.8)
          .fromTo(".b-save", { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.05 }, 0.82)
          .fromTo(".b-cursor", { scale: 0.85 }, { scale: 1, duration: 0.04, ease: "back.out(3)", immediateRender: false }, 0.8)
          // Scroll progress is mapped onto this timeline, so it has to be exactly 1 long.
          .set({}, {}, 1);
        return tl;
      };

      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const tl = build();
        ScrollTrigger.create({
          trigger: root.current, start: "top top", end: "+=3400", pin: true, scrub: 0.4, anticipatePin: 1,
          onUpdate: (self) => { tl.progress(self.progress); sync(self.progress); },
        });
      });
      mm.add("(prefers-reduced-motion: reduce), (max-width: 1023px)", () => {
        build().progress(1);
        sync(1);
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section ref={root} className="on-dark relative flex min-h-dvh flex-col justify-center overflow-hidden bg-bench text-paper">
      <div className="mx-auto w-full max-w-[1480px] px-5 py-16 md:px-10">
        <h2 className="display max-w-[16ch] text-[clamp(2.4rem,5vw,4.5rem)]">Watch a page get built.</h2>
        <p className="mt-5 max-w-[56ch] text-xl leading-snug text-paper/75">HTML is the structure. CSS is the look. JavaScript is what happens when you click.</p>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-bed" data-cursor>
            <div className="flex items-center gap-1 px-3 pt-3" role="tablist" aria-label="Files">
              {langs.map((l) => (
                <span key={l} role="tab" aria-selected={tab === l} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${tab === l ? "bg-bed-raised text-paper" : "text-fade"}`}>
                  <span className={`size-2 rounded-full ${dot[l]}`} aria-hidden />
                  {l === "js" ? "JS" : l.toUpperCase()}
                </span>
              ))}
            </div>
            <div className="relative h-[340px] overflow-hidden p-5 font-mono text-[13px] leading-6">
              {langs.map((l) => (
                <pre key={l} className={`absolute inset-5 m-0 whitespace-pre-wrap ${tab === l ? "" : "invisible"}`} aria-label={`${l} code`}>
                  {(() => {
                    let idx = 0;
                    return tokens[l].map((tk, ti) => (
                      <span key={ti} className={tk.c}>
                        {[...tk.t].map((ch) => {
                          const i = idx++;
                          return <span key={i} ref={(el) => { if (el) spans.current[l][i] = el; }} style={{ opacity: 0 }}>{ch}</span>;
                        })}
                      </span>
                    ));
                  })()}
                </pre>
              ))}
            </div>
          </div>

          <div className="b-scene relative grid h-[400px] place-items-center overflow-hidden rounded-2xl bg-white lg:h-auto" style={{ fontFamily: "'Times New Roman', serif" }} role="img" aria-label="The plan card being built from the code">
            <article className="b-card text-black">
              <h2 className="b-h m-0 text-[24px] font-bold">Pro</h2>
              <p className="b-price m-0 text-[16px]"><span className="b-amount inline-block">$12</span> / month</p>
              <label className="b-switch relative my-1 flex items-center gap-1.5 text-[16px]">
                <input type="checkbox" className="b-check" tabIndex={-1} readOnly />
                Pay yearly
                <MousePointer2 className="b-cursor pointer-events-none absolute -left-1 top-3 fill-ink text-white opacity-0" size={26} aria-hidden />
              </label>
              <p className="b-save m-0 mb-2 text-[14px] text-[#565878]" style={{ opacity: 0 }}>You save 25%</p>
              <span className="b-btn-wrap inline-block">
                <button className="b-btn border border-black/50 bg-zinc-200 px-1.5 py-0.5 text-[14px]" tabIndex={-1}>Choose Pro</button>
              </span>
            </article>
          </div>
        </div>
        <div className="mt-8 flex gap-2" aria-hidden>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper/10"><div className="bar-fill h-full origin-left rounded-full bg-gradient-to-r from-html via-css to-js" style={{ transform: "scaleX(0)" }} /></div>
        </div>
      </div>
    </section>
  );
}
