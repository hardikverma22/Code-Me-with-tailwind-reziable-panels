import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Link2 } from "lucide-react";
import SiteNav from "../components/SiteNav";
import Aurora from "../components/Aurora";
import Editor from "../components/Editor";
import PreviewFrame from "../components/PreviewFrame";
import ProofSheet from "../components/ProofSheet";
import TemplateThumb from "../components/TemplateThumb";
import { inkFor } from "../components/EditorPane";
import { templates } from "../lib/templates";
import { useProject } from "../store/project";
import type { Language } from "../lib/format";

gsap.registerPlugin(ScrollTrigger);

const starter = {
  html: `<h1>Hello, CodeMe</h1>
<button id="go">Press me</button>
<p id="out"></p>
`,
  css: `body { font: 700 20px system-ui; padding: 20px; color: #12122b; }
h1 { font-size: 34px; margin: 0 0 14px; }
button { background: #7b61ff; color: #fff; border: 0; border-radius: 999px; padding: 10px 18px; font: inherit; cursor: pointer; }
`,
  js: `let n = 0;
document.getElementById("go").onclick = () => {
  document.getElementById("out").textContent = "Pressed " + ++n + " times";
};
`,
};

const languages: Language[] = ["html", "css", "js"];

function Hero() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Language>("html");
  const [code, setCode] = useState(starter);
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
        tl.from(".hl-line", { yPercent: 105, duration: 1.1, stagger: 0.1 })
          .from(".hero-fade", { opacity: 0, y: 16, duration: 0.8, stagger: 0.08 }, "-=0.7")
          .from(".hero-win", { opacity: 0, y: 48, scale: 0.97, duration: 1.2, stagger: 0.15 }, "-=1");
      });
    },
    { scope: root }
  );

  const start = () => {
    useProject.getState().load(code, null);
    navigate("/new");
  };

  return (
    <section ref={root} className="relative overflow-hidden">
      <Aurora />
      <SiteNav />
      <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 px-5 pb-24 pt-8 md:px-8 lg:grid-cols-12 lg:pb-36 lg:pt-14">
        <div className="lg:col-span-6">
          <h1 className="display text-[clamp(3rem,7.2vw,5.75rem)]">
            {["Write code.", "Watch it", "come alive."].map((line) => (
              <span key={line} className="-mb-[0.08em] block overflow-hidden pb-[0.12em]">
                <span className="hl-line block">{line}</span>
              </span>
            ))}
          </h1>
          <p className="hero-fade mt-8 max-w-[36ch] text-xl leading-snug text-muted">
            A free playground for HTML, CSS and JavaScript. No account. Every Share is a link anyone can open and fork.
          </p>
          <div className="hero-fade mt-9 flex flex-wrap items-center gap-6">
            <button onClick={start} className="group flex items-center gap-2 rounded-full bg-ink px-7 py-4 text-lg font-bold text-white transition hover:shadow-[0_0_0_6px_rgb(123_97_255_/_0.3)]">
              Start coding <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
            </button>
            <Link to="/gallery" className="text-lg font-semibold text-ink">Browse templates</Link>
          </div>
        </div>

        <div className="relative lg:col-span-6">
          <div className="hero-win lift overflow-hidden rounded-2xl bg-bed">
            <div role="tablist" className="flex items-center gap-1 px-3 pt-3" aria-label="Try it: edit a file">
              {languages.map((l) => (
                <button
                  key={l}
                  role="tab"
                  aria-selected={tab === l}
                  onClick={() => setTab(l)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold transition-colors ${tab === l ? "bg-bed-raised text-paper" : "text-fade hover:text-paper"}`}
                >
                  <span className={`size-2 rounded-full ${inkFor[l].dot}`} aria-hidden />
                  {l === "js" ? "JS" : l.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="h-[200px] pt-1">
              <Editor language={tab} value={code[tab]} onChange={(v) => setCode((c) => ({ ...c, [tab]: v }))} />
            </div>
          </div>
          <ProofSheet className="hero-win -mt-8 ml-8 h-[210px] sm:ml-14">
            <PreviewFrame sources={code} debounceMs={450} className="h-full w-full bg-white" />
          </ProofSheet>
        </div>
      </div>
    </section>
  );
}

const layers = [
  { id: "html", name: "HTML", dot: "bg-coral", line: "The structure. Headings, buttons and lists: what is on the page." },
  { id: "css", name: "CSS", dot: "bg-aqua", line: "The look. Colour, type, layout and motion." },
  { id: "js", name: "JavaScript", dot: "bg-violet", line: "The behaviour. What happens when you press, type or wait." },
];

/** An exploded view of a page: three layers that separate as you scroll. */
function ExplodedView() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const stack = ".layer";
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(stack, { z: (i) => i * 90 });
        gsap.set(".cap", { opacity: 1 });
      });
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 1024px)", () => {
        gsap.set(".cap", { opacity: 0.45 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: root.current, start: "top top", end: "+=1400", scrub: 0.6, pin: true, anticipatePin: 1 },
          defaults: { ease: "none" },
        });
        tl.fromTo(stack, { z: 0 }, { z: (i) => i * 120, duration: 1 }, 0)
          .fromTo(".stage", { rotateZ: -22 }, { rotateZ: -34, duration: 1 }, 0)
          .to(".cap-0", { opacity: 1, duration: 0.2 }, 0)
          .to(".cap-0", { opacity: 0.45, duration: 0.2 }, 0.38)
          .to(".cap-1", { opacity: 1, duration: 0.2 }, 0.38)
          .to(".cap-1", { opacity: 0.45, duration: 0.2 }, 0.72)
          .to(".cap-2", { opacity: 1, duration: 0.2 }, 0.72);
      });
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 1023px)", () => {
        gsap.fromTo(stack, { z: 0 }, {
          z: (i) => i * 70, ease: "power2.out", duration: 1.2,
          scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
        });
      });
    },
    { scope: root }
  );

  return (
    <section ref={root} className="relative bg-white">
      <div className="mx-auto grid min-h-dvh max-w-[1320px] items-center gap-12 px-5 py-20 md:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="display text-[clamp(2.6rem,5.5vw,4.5rem)]">Every page is three layers.</h2>
          <ul className="mt-10 space-y-6">
            {layers.map((l, i) => (
              <li key={l.id} className={`cap cap-${i} flex gap-4`}>
                <span className={`mt-2 size-3 shrink-0 rounded-full ${l.dot}`} aria-hidden />
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">{l.name}</p>
                  <p className="max-w-[34ch] text-lg text-muted">{l.line}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex h-[440px] items-center justify-center lg:col-span-7 lg:h-[620px]" style={{ perspective: "1600px" }} aria-hidden>
          <div className="stage relative h-[300px] w-[240px] sm:h-[360px] sm:w-[290px]" style={{ transformStyle: "preserve-3d", transform: "rotateX(58deg) rotateZ(-28deg)" }}>
            {/* HTML: the wireframe */}
            <div className="layer absolute inset-0 rounded-2xl border-2 border-coral bg-white/90 p-5" style={{ transformStyle: "preserve-3d" }}>
              <div className="h-7 w-3/5 rounded border-2 border-dashed border-coral/70" />
              <div className="mt-4 h-3 w-full rounded border border-dashed border-coral/60" />
              <div className="mt-2 h-3 w-5/6 rounded border border-dashed border-coral/60" />
              <div className="mt-6 h-10 w-28 rounded-full border-2 border-dashed border-coral/70" />
            </div>
            {/* CSS: the skin */}
            <div className="layer absolute inset-0 rounded-2xl border-2 border-aqua bg-aqua/15 p-5" style={{ transformStyle: "preserve-3d" }}>
              <div className="h-7 w-3/5 rounded bg-ink" />
              <div className="mt-4 h-3 w-full rounded bg-ink/25" />
              <div className="mt-2 h-3 w-5/6 rounded bg-ink/25" />
              <div className="mt-6 h-10 w-28 rounded-full bg-violet" />
            </div>
            {/* JS: the behaviour */}
            <div className="layer absolute inset-0 rounded-2xl border-2 border-violet bg-violet/10 p-5" style={{ transformStyle: "preserve-3d" }}>
              <div className="absolute bottom-16 left-24 size-14 rounded-full border-2 border-violet" />
              <div className="absolute bottom-[4.4rem] left-[6.4rem] size-6 rounded-full bg-violet" />
              <div className="absolute bottom-5 left-5 rounded-full bg-ink px-3 py-1 font-mono text-xs font-bold text-white">Pressed 3 times</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShareLink() {
  return (
    <section className="relative overflow-hidden">
      <Aurora strength={0.55} />
      <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 py-24 md:px-8 lg:grid-cols-12 lg:py-36">
        <div className="lg:col-span-7">
          <h2 className="display text-[clamp(2.6rem,6vw,4.75rem)]">A link is the whole project.</h2>
          <p className="mt-6 max-w-[46ch] text-xl leading-relaxed text-muted">
            Press Share and your code is saved behind a short link. Send it anywhere. Whoever opens it can read it, run it, and change it.
          </p>
        </div>
        <div className="lg:col-span-5">
          <p className="lift inline-flex items-center gap-3 rounded-full bg-ink px-6 py-4 font-mono text-base font-bold text-white sm:text-xl">
            <Link2 size={20} aria-hidden /> codeme.app/p/x7k2m9qa
          </p>
          <ol className="mt-10 space-y-5 text-lg">
            {[
              ["bg-coral", "Open it.", "It loads straight into the editor."],
              ["bg-aqua", "Change it.", "Your edits stay on your side."],
              ["bg-violet", "Share again.", "You get a new link. The original never changes."],
            ].map(([dot, head, body]) => (
              <li key={head} className="flex gap-4">
                <span className={`mt-2.5 size-3 shrink-0 rounded-full ${dot}`} aria-hidden />
                <p><b className="font-extrabold">{head}</b> <span className="text-muted">{body}</span></p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

function TemplateStrip() {
  const picks = [templates[1], templates[2], templates[4], templates[6]];
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-[1320px] px-5 py-24 md:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="display text-[clamp(2.6rem,6vw,4.75rem)]">Start from something that runs.</h2>
          <Link to="/gallery" className="flex items-center gap-1.5 text-lg font-semibold text-ink">
            All {templates.length} templates <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {picks.map((t, i) => (
            <Link key={t.id} to={`/new?template=${t.id}`} className={`group block text-ink no-underline ${i % 2 ? "lg:mt-12" : ""}`}>
              <TemplateThumb sources={t} title={t.title} />
              <p className="mt-4 text-lg font-extrabold group-hover:underline">{t.title}</p>
              <p className="text-sm text-muted">{t.blurb}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function Close() {
  const navigate = useNavigate();
  return (
    <section className="on-dark relative overflow-hidden bg-ink text-paper">
      <Aurora strength={0.7} />
      <div className="relative mx-auto flex max-w-[1320px] flex-col items-start gap-9 px-5 py-28 md:px-8 lg:py-40">
        <h2 className="display max-w-[12ch] text-[clamp(3rem,8vw,6.5rem)]">Your idea is one tab away.</h2>
        <button onClick={() => navigate("/new")} className="group flex items-center gap-2 rounded-full bg-paper px-8 py-4 text-lg font-bold text-ink transition hover:shadow-[0_0_0_6px_rgb(255_255_255_/_0.25)]">
          Start coding <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" aria-hidden />
        </button>
      </div>
      <footer className="relative mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-4 px-5 pb-8 text-sm text-paper/80 md:px-8">
        <span>CodeMe is free. Your work autosaves in this browser.</span>
        <a href="https://github.com/hardikverma22/Code-Me-with-tailwind-reziable-panels" className="text-paper">Source on GitHub</a>
      </footer>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Hero />
      <ExplodedView />
      <ShareLink />
      <TemplateStrip />
      <Close />
    </>
  );
}
