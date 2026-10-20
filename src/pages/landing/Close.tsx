import { useNavigate } from "react-router";
import Marquee from "../../fx/Marquee";
import Magnetic from "../../fx/Magnetic";

export default function Close() {
  const navigate = useNavigate();
  return (
    <section className="on-dark relative overflow-hidden bg-bench text-paper">
      <Marquee words={["Write", "Preview", "Share", "Fork", "Repeat"]} className="py-6 text-[clamp(2rem,5vw,4rem)] font-extrabold tracking-tight text-paper/20" />
      <div className="relative mx-auto flex max-w-[1480px] flex-col items-center px-5 py-24 text-center md:px-10 lg:py-36">
        <Magnetic strength={0.2}>
          <button onClick={() => navigate("/new")} className="display group text-[clamp(3.6rem,15vw,14rem)] transition-colors duration-500" data-cursor aria-label="Start coding">
            <span className="stroke-text block transition-all duration-500 group-hover:text-paper">Start</span>
            <span className="block text-paper transition-all duration-500 group-hover:stroke-text group-hover:text-transparent">coding</span>
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
