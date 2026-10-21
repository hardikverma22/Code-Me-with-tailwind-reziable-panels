import { useCallback, useEffect, useState } from "react";
import SmoothScroll from "../fx/SmoothScroll";
import Cursor from "../fx/Cursor";
import Preloader from "../fx/Preloader";
import Hero from "./landing/Hero";
import Build from "./landing/Build";
import Rail from "./landing/Rail";
import Fork from "./landing/Fork";
import Fix from "./landing/Fix";
import Close from "./landing/Close";

const seen = () => {
  try { return sessionStorage.getItem("codeme-intro") === "1"; } catch { return false; }
};

export default function Landing() {
  const skip = seen() || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [ready, setReady] = useState(skip);

  useEffect(() => {
    document.body.classList.add("editor-bg");
    return () => document.body.classList.remove("editor-bg");
  }, []);

  const done = useCallback(() => {
    try { sessionStorage.setItem("codeme-intro", "1"); } catch { /* ignore */ }
    setReady(true);
  }, []);

  return (
    <div className="bg-bench">
      <SmoothScroll />
      <Cursor />
      {!ready && <Preloader onDone={done} />}
      <Hero ready={ready} />
      <Build />
      <Fix />
      <Rail />
      <Fork />
      <Close />
    </div>
  );
}
