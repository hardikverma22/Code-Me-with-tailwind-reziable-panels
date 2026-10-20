import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { MousePointer2 } from "lucide-react";
import { tokenize } from "../../lib/highlight";

gsap.registerPlugin(ScrollTrigger);

const code = {
  html: `<div class="card">
  <h3>Hello, CodeMe</h3>
  <p id="out">Pressed 0 times</p>
  <button id="go">Press me</button>
</div>`,
  css: `body { background: #1d1d3c; }
.card {
  background: white;
  padding: 32px;
  border-radius: 24px;
  box-shadow: 0 30px 60px #0006;
}
h3 { font-size: 34px; color: #12122b; }
p { color: #565878; }
button {
  background: #7b61ff;
  color: white;
  border-radius: 999px;
  padding: 10px 20px;
}`,
  js: `let n = 0;
go.onclick = () => {
  out.textContent =
    "Pressed " + ++n + " times";
};`,
} as const;

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
        // HTML: elements appear, unstyled
        tl.fromTo(".b-h", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.08)
          .fromTo(".b-p", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.17)
          .fromTo(".b-btn", { opacity: 0 }, { opacity: 1, duration: 0.04 }, 0.26)
          // CSS: the page gets its look
          .to(".b-scene", { backgroundColor: "#1d1d3c", duration: 0.04 }, 0.37)
          .to(".b-card", { backgroundColor: "#ffffff", padding: 32, borderRadius: 24, boxShadow: "0 30px 60px rgba(0,0,0,0.4)", duration: 0.06 }, 0.43)
          .to(".b-h", { fontSize: 34, color: "#12122b", fontWeight: 800, duration: 0.05 }, 0.5)
          .set(".b-card", { fontFamily: "Bricolage Grotesque, system-ui, sans-serif" }, 0.5)
          .to(".b-p", { color: "#565878", duration: 0.04 }, 0.56)
          .to(".b-btn", { backgroundColor: "#7b61ff", color: "#fff", borderRadius: 999, paddingLeft: 20, paddingRight: 20, borderWidth: 0, duration: 0.05 }, 0.59)
          // JS: it responds
          .fromTo(".b-cursor", { opacity: 0, x: 90, y: 70 }, { opacity: 1, x: 0, y: 0, duration: 0.08, ease: "power2.out" }, 0.68);
        const count = { n: 0 };
        tl.to(count, { n: 3, ease: "steps(3)", duration: 0.21, onUpdate: () => { const el = root.current?.querySelector(".b-p"); if (el) el.textContent = `Pressed ${Math.round(count.n)} times`; } }, 0.76);
        [0.77, 0.84, 0.91].forEach((at) => {
          tl.fromTo(".b-btn", { scale: 0.93 }, { scale: 1, duration: 0.04, ease: "back.out(3)" }, at)
            .fromTo(".b-ring", { scale: 0.6, opacity: 0.7 }, { scale: 2.4, opacity: 0, duration: 0.05 }, at);
        });
        return tl;
      };

      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        const tl = build();
        ScrollTrigger.create({
          trigger: root.current, start: "top top", end: "+=3400", pin: true, scrub: 0.4, anticipatePin: 1,
          onUpdate: (self) => { tl.progress(self.progress); sync(self.progress); },
        });
        gsap.set(".b-p", { opacity: 0 });
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

          <div className="b-scene relative grid h-[400px] place-items-center overflow-hidden rounded-2xl bg-white lg:h-auto" style={{ fontFamily: "'Times New Roman', serif" }} role="img" aria-label="The page being built from the code">
            <div className="b-card text-black">
              <h3 className="b-h m-0 text-[16px] font-bold">Hello, CodeMe</h3>
              <p className="b-p my-2 text-[16px]">Pressed 0 times</p>
              <span className="relative inline-block">
                <span className="b-ring absolute inset-0 rounded-full border-2 border-violet opacity-0" />
                <button className="b-btn border border-black/50 bg-zinc-200 px-1.5 py-0.5 text-[14px]" tabIndex={-1}>Press me</button>
              </span>
            </div>
            <MousePointer2 className="b-cursor pointer-events-none absolute left-[54%] top-[62%] fill-ink text-white opacity-0" size={26} aria-hidden />
          </div>
        </div>
        <div className="mt-8 flex gap-2" aria-hidden>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-paper/10"><div className="bar-fill h-full origin-left rounded-full bg-gradient-to-r from-html via-css to-js" style={{ transform: "scaleX(0)" }} /></div>
        </div>
      </div>
    </section>
  );
}
