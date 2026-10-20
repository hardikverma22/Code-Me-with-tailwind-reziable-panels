import { SANDBOX } from "../components/PreviewFrame";
import { buildSrcDoc } from "./buildSrcDoc";

describe("preview sandbox", () => {
  it("runs scripts without same-origin access", () => {
    const flags = SANDBOX.split(" ");
    expect(flags).toContain("allow-scripts");
    // allow-scripts + allow-same-origin lets the frame remove its own sandbox (MDN, OWASP).
    expect(flags).not.toContain("allow-same-origin");
    expect(flags).not.toContain("allow-top-navigation");
    expect(flags).not.toContain("allow-popups");
  });
});

describe("buildSrcDoc", () => {
  it("maps JS errors back to the user's own line numbers", () => {
    const doc = buildSrcDoc({ html: "<p>x</p>", css: "", js: "line1();\nline2();" });
    const offset = Number(/__jsOffset=(\d+)/.exec(doc)![1]);
    const lines = doc.split("\n");
    // the document line that holds the user's first line is offset + 1 (1-based)
    expect(lines[offset]).toContain("line1();");
  });
  it("loads Tailwind only when asked, with CSS as a Tailwind stylesheet", () => {
    expect(buildSrcDoc({ html: "", css: "", js: "" })).not.toContain("tailwindcss/browser");
    const doc = buildSrcDoc({ html: "", css: ".a{@apply p-4}", js: "", tailwind: true });
    expect(doc).toContain("@tailwindcss/browser@4.1.11");
    expect(doc).toContain('type="text/tailwindcss"');
  });
});
