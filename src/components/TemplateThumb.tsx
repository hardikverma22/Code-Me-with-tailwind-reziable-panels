import { useEffect, useRef, useState } from "react";
import PreviewFrame from "./PreviewFrame";
import type { Sources } from "../lib/buildSrcDoc";

const W = 960;
const H = 600;

/** A live, scaled-down render of a project. Loads only when scrolled into view. */
export default function TemplateThumb({ sources, title }: { sources: Sources; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / W));
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(el);
    return () => { ro.disconnect(); io.disconnect(); };
  }, []);

  return (
    <div ref={box} className="lift relative aspect-[8/5] w-full overflow-hidden rounded-2xl bg-white transition-transform duration-300 group-hover:-translate-y-1">
      {visible && (
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <PreviewFrame
            sources={sources}
            debounceMs={0}
            interactive={false}
            title={`${title} preview`}
            className="h-full w-full border-0 bg-white"
          />
        </div>
      )}
    </div>
  );
}
