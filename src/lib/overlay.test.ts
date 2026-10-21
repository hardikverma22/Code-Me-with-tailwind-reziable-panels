import { isOverlayImage, overlayStyle } from "./overlay";

describe("overlayStyle", () => {
  it("fades by opacity and clamps out-of-range values", () => {
    expect(overlayStyle("fade", 40, 50).opacity).toBe(0.4);
    expect(overlayStyle("fade", 250, 50).opacity).toBe(1);
    expect(overlayStyle("fade", -5, 50).opacity).toBe(0);
  });
  it("clips the reference from the right in split mode", () => {
    expect(overlayStyle("split", 50, 30).clipPath).toBe("inset(0 70% 0 0)");
    expect(overlayStyle("split", 50, 30).opacity).toBe(1);
  });
  it("uses a difference blend in difference mode", () => {
    expect(overlayStyle("difference", 50, 50).mixBlendMode).toBe("difference");
  });
});

describe("isOverlayImage", () => {
  it("accepts raster images within the size limit", () => {
    expect(isOverlayImage({ type: "image/png", size: 1000 })).toBe(true);
    expect(isOverlayImage({ type: "image/jpeg", size: 1000 })).toBe(true);
  });
  it("rejects SVG, non-images and oversized files", () => {
    expect(isOverlayImage({ type: "image/svg+xml", size: 10 })).toBe(false);
    expect(isOverlayImage({ type: "text/html", size: 10 })).toBe(false);
    expect(isOverlayImage({ type: "image/png", size: 9 * 1024 * 1024 })).toBe(false);
  });
});
