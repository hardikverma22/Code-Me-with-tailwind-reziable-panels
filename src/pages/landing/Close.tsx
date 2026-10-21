import { ArrowUpRight } from "lucide-react";
import Marquee from "../../fx/Marquee";
import Magnetic from "../../fx/Magnetic";

const REPO = "https://github.com/hardikverma22/code-me";

/** The close asks for something different from the hero: read how it is made. Starting to code is already offered above. */
export default function Close() {
  return (
    <section className="on-dark relative overflow-hidden bg-bench text-paper">
      <Marquee words={["Write", "Check", "Fix", "Share", "Fork", "Repeat"]} className="border-y border-paper/10 py-5 text-[clamp(1.6rem,4vw,3rem)] font-extrabold tracking-tight text-paper/45" />
      <div className="relative mx-auto flex max-w-[1480px] flex-col items-start gap-8 px-5 py-24 md:px-10 lg:py-36">
        <p className="max-w-[30ch] text-2xl font-semibold text-paper/80">Free, with no account. The code is public, and so is how every fix is checked.</p>
        <Magnetic strength={0.15}>
          <a href={REPO} className="display group flex flex-wrap items-center gap-x-[0.25em] text-left no-underline text-[clamp(3.2rem,11vw,10rem)]" data-cursor>
            <span className="stroke-text transition-all duration-500 group-hover:text-paper">Read</span>
            <span className="text-paper transition-all duration-500 group-hover:stroke-text group-hover:text-transparent">the source</span>
            <ArrowUpRight className="size-[0.6em] transition-transform duration-500 group-hover:-translate-y-3 group-hover:translate-x-3" aria-hidden />
          </a>
        </Magnetic>
      </div>
      <footer className="relative mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 pb-8 text-sm text-paper/70 md:px-10">
        <span>CodeMe is free. Your work autosaves in this browser.</span>
        <a href={`${REPO}#verified-fixes-without-a-server`} className="text-paper">How verified fixes work</a>
      </footer>
    </section>
  );
}
