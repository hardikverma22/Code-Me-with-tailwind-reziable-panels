export type OverlayMode = "fade" | "split" | "difference";

export const OVERLAY_MODES: { id: OverlayMode; label: string; hint: string }[] = [
  { id: "fade", label: "Fade", hint: "Blend the reference over your page" },
  { id: "split", label: "Split", hint: "Reference on the left, your page on the right" },
  { id: "difference", label: "Difference", hint: "Matching pixels turn black" },
];

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

/** Inline style for the reference image that sits on top of the preview. */
export function overlayStyle(mode: OverlayMode, opacity: number, split: number) {
  const base: { opacity: number; clipPath?: string; mixBlendMode?: "difference" } = { opacity: 1 };
  if (mode === "fade") return { ...base, opacity: clamp(opacity) / 100 };
  if (mode === "split") return { ...base, clipPath: `inset(0 ${100 - clamp(split)}% 0 0)` };
  return { ...base, mixBlendMode: "difference" as const };
}

/** Only raster images the browser can show; SVG is refused so a file can never carry script into the page. */
export const isOverlayImage = (file: Pick<File, "type" | "size">, maxBytes = 8 * 1024 * 1024) =>
  /^image\/(png|jpeg|webp|gif|avif)$/.test(file.type) && file.size <= maxBytes;
