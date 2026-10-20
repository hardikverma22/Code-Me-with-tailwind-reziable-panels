import { useEffect, useRef } from "react";

const COLORS = ["255,115,81", "34,199,230", "123,97,255"]; // coral, aqua, violet

/** Light trails drifting through a noise field; the pointer pushes them aside. */
export default function FlowField({ className = "" }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0, h = 0, raf = 0, visible = true;
    const mouse = { x: -9999, y: -9999 };

    type P = { x: number; y: number; c: number; life: number };
    let ps: P[] = [];
    const spawn = (): P => ({ x: Math.random() * w, y: Math.random() * h, c: Math.floor(Math.random() * 3), life: 80 + Math.random() * 160 });

    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "#0b0b1a"; ctx.fillRect(0, 0, w, h);
      ps = Array.from({ length: Math.min(1100, Math.floor((w * h) / 1800)) }, spawn);
    };

    let t = 0;
    const step = () => {
      t += 0.0026;
      ctx.fillStyle = "rgba(11,11,26,0.07)";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (const p of ps) {
        const a = (Math.sin(p.x * 0.0032 + t * 3) + Math.cos(p.y * 0.0041 - t * 2) + Math.sin((p.x + p.y) * 0.002 + t)) * 1.6;
        let vx = Math.cos(a) * 1.25, vy = Math.sin(a) * 1.25;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 22000) { const f = (1 - d2 / 22000) * 4; const d = Math.sqrt(d2) || 1; vx += (dx / d) * f; vy += (dy / d) * f; }
        const nx = p.x + vx, ny = p.y + vy;
        ctx.strokeStyle = `rgba(${COLORS[p.c]},0.5)`;
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        p.x = nx; p.y = ny; p.life--;
        if (p.life <= 0 || nx < -20 || ny < -20 || nx > w + 20 || ny > h + 20) Object.assign(p, spawn());
      }
      ctx.globalCompositeOperation = "source-over";
    };

    const loop = () => { if (visible) step(); raf = requestAnimationFrame(loop); };
    const move = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));

    resize();
    io.observe(cv);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move);
    if (reduced) { for (let i = 0; i < 240; i++) step(); } else raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf); io.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return <canvas ref={canvas} className={`absolute inset-0 h-full w-full ${className}`} aria-hidden />;
}
