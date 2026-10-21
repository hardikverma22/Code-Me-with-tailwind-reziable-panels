import { useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { isOverlayImage, OVERLAY_MODES, overlayStyle, type OverlayMode } from "../lib/overlay";

/**
 * Lays a reference screenshot over the preview so a page can be matched to a design.
 * The image stays in this browser tab: it is never uploaded and is not saved with the project.
 */
export default function ReferenceOverlay() {
  const [src, setSrc] = useState<string | null>(null);
  const [mode, setMode] = useState<OverlayMode>("fade");
  const [opacity, setOpacity] = useState(50);
  const [split, setSplit] = useState(50);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);

  const pick = (file: File | undefined) => {
    if (!file) return;
    if (!isOverlayImage(file)) return setError("Use a PNG, JPEG, WebP or GIF under 8 MB.");
    setError("");
    setSrc(URL.createObjectURL(file));
  };

  const style = overlayStyle(mode, opacity, split);
  const slider = mode === "split" ? split : opacity;

  return (
    <>
      {src && (
        <>
          <img
            src={src}
            alt=""
            data-testid="reference-image"
            className="pointer-events-none absolute left-0 top-0 z-10 h-auto w-full max-w-none"
            style={style}
          />
          {mode === "split" && <div aria-hidden className="pointer-events-none absolute inset-y-0 z-10 w-0.5 bg-violet" style={{ left: `${split}%` }} />}
        </>
      )}

      <div className="absolute bottom-2 right-2 z-20 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-2 rounded-xl bg-bed/90 p-1.5 text-paper shadow-lg ring-1 ring-rule backdrop-blur">
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" aria-label="Reference image" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
        {!src ? (
          <button onClick={() => input.current?.click()} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold hover:bg-bed-raised" title="Compare your page with a screenshot or mockup">
            <ImageUp size={14} aria-hidden /> Compare to image
          </button>
        ) : (
          <>
            <div role="group" aria-label="Comparison mode" className="flex rounded-lg bg-bench p-0.5">
              {OVERLAY_MODES.map((m) => (
                <button key={m.id} onClick={() => setMode(m.id)} aria-pressed={mode === m.id} title={m.hint} className={`rounded-md px-2 py-1 text-xs font-bold ${mode === m.id ? "bg-paper text-ink" : "text-fade hover:text-paper"}`}>
                  {m.label}
                </button>
              ))}
            </div>
            {mode !== "difference" && (
              <label className="flex items-center gap-1.5 text-xs font-semibold text-fade">
                {mode === "split" ? "Split" : "Opacity"}
                <input
                  type="range" min={0} max={100} value={slider}
                  onChange={(e) => (mode === "split" ? setSplit : setOpacity)(Number(e.target.value))}
                  className="w-24 accent-violet"
                />
              </label>
            )}
            <button onClick={() => input.current?.click()} className="rounded-lg px-2 py-1 text-xs font-bold text-fade hover:text-paper">Replace</button>
            <button onClick={() => setSrc(null)} aria-label="Remove reference image" className="rounded-lg p-1 text-fade hover:text-paper"><X size={14} /></button>
          </>
        )}
      </div>
      {error && <p className="absolute bottom-14 right-2 z-20 max-w-[16rem] rounded-lg bg-danger px-3 py-2 text-xs font-semibold text-ink shadow-lg" role="alert">{error}</p>}
    </>
  );
}
