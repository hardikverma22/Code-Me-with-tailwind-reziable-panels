import { useNavigate } from "react-router";
import { ArrowRight } from "lucide-react";
import Marquee from "../../fx/Marquee";
import Magnetic from "../../fx/Magnetic";

export default function Close() {
  const navigate = useNavigate();
  return (
    <section className="on-dark relative overflow-hidden bg-bench text-paper">
      <Marquee words={["Write", "Preview", "Share", "Fork", "Repeat"]} className="border-y border-paper/10 py-5 text-[clamp(1.6rem,4vw,3rem)] font-extrabold tracking-tight text-paper/45" />
      <div className="relative mx-auto flex max-w-[1480px] flex-col items-start gap-8 px-5 py-24 md:px-10 lg:py-36">
        <p className="max-w-[24ch] text-2xl font-semibold text-paper/80">Your idea is one tab away. No account, no setup.</p>
        <Magnetic strength={0.15}>
          <button onClick={() => navigate("/new")} className="display group flex flex-wrap items-center gap-x-[0.25em] text-left text-[clamp(3.6rem,13vw,12rem)]" data-cursor aria-label="Start coding">
            <span className="stroke-text transition-all duration-500 group-hover:text-paper">Start</span>
            <span className="text-paper transition-all duration-500 group-hover:stroke-text group-hover:text-transparent">coding</span>
            <ArrowRight className="size-[0.6em] transition-transform duration-500 group-hover:translate-x-4" aria-hidden />
          </button>
        </Magnetic>
      </div>
      <footer className="relative mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4 px-5 pb-8 text-sm text-paper/70 md:px-10">
        <span>CodeMe is free. Your work autosaves in this browser.</span>
        <a href="https://github.com/hardikverma22/Code-Me-with-tailwind-reziable-panels" className="text-paper">Source on GitHub</a>
      </footer>
    </section>
  );
}
