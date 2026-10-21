type RGB = [number, number, number];

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
export const luminance = ([r, g, b]: RGB) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

export function contrastRatio(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/**
 * The colour closest to `fg` that reaches `need`:1 on `bg`, moving toward black or white, whichever the
 * background allows. Null when not even black or white is enough.
 */
export function passingColor(fg: RGB, bg: RGB, need: number): RGB | null {
  const target: RGB = contrastRatio([0, 0, 0], bg) >= contrastRatio([255, 255, 255], bg) ? [0, 0, 0] : [255, 255, 255];
  if (contrastRatio(target, bg) < need) return null;
  const mix = (t: number): RGB => fg.map((v, i) => Math.round(v + (target[i] - v) * t)) as RGB;
  // A small margin keeps rounding to whole channel values from landing just under the line.
  const goal = need + 0.05;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (contrastRatio(mix(mid), bg) >= goal) hi = mid;
    else lo = mid;
  }
  const out = mix(hi);
  return contrastRatio(out, bg) >= need ? out : target;
}
