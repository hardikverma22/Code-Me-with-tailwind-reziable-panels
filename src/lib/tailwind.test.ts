import { classOptions, classTokenAt, cssToTailwind, declarationToClasses, tailwindClasses } from "./tailwind";

describe("class suggestions", () => {
  it("knows the common utilities and colour scales", () => {
    const all = tailwindClasses();
    for (const c of ["flex", "items-center", "p-4", "px-2.5", "text-xl", "bg-blue-500", "rounded-lg", "w-1/2", "max-w-3xl"]) expect(all).toContain(c);
  });

  it("suggests by prefix", () => {
    const { options } = classOptions("bg-blue-5");
    expect(options).toContain("bg-blue-500");
    expect(options.every((o) => o.startsWith("bg-blue-5"))).toBe(true);
  });

  it("keeps the typed variant and completes the utility after it", () => {
    const { keep, options } = classOptions("hover:bg-r");
    expect(keep).toBe("hover:".length);
    expect(options.length).toBeGreaterThan(0);
    expect(options.every((o) => o.startsWith("bg-r"))).toBe(true);
  });

  it("offers variants while no colon has been typed", () => {
    expect(classOptions("hov").options).toContain("hover:");
    expect(classOptions("md").options).toContain("md:");
  });

  it("stays quiet on an empty word", () => {
    expect(classOptions("").options).toEqual([]);
  });
});

describe("classTokenAt", () => {
  const text = '<div class="flex items-c" id="x"><p class="p-4 te';
  it("finds the word being typed inside class=\"\"", () => {
    const pos = text.indexOf("items-c") + "items-c".length;
    expect(classTokenAt(text, pos)).toEqual({ from: text.indexOf("items-c"), token: "items-c" });
  });
  it("works at the end of an unfinished attribute", () => {
    expect(classTokenAt(text, text.length)).toEqual({ from: text.length - 2, token: "te" });
  });
  it("returns null outside a class attribute", () => {
    expect(classTokenAt(text, text.indexOf('id="x"') + 3)).toBeNull();
    expect(classTokenAt("<p>hello", 8)).toBeNull();
    expect(classTokenAt('<p class="a">text', 17)).toBeNull();
  });
  it("handles single quotes and className", () => {
    expect(classTokenAt("<p className='mt-", 17)).toEqual({ from: 14, token: "mt-" });
  });
});

describe("declarationToClasses", () => {
  const cases: [string, string, string[]][] = [
    ["display", "flex", ["flex"]],
    ["display", "none", ["hidden"]],
    ["align-items", "center", ["items-center"]],
    ["justify-content", "space-between", ["justify-between"]],
    ["padding", "16px", ["p-4"]],
    ["padding", "8px 24px", ["py-2", "px-6"]],
    ["padding", "1rem 2rem 3rem", ["pt-4", "px-8", "pb-12"]],
    ["margin", "0 auto", ["my-0", "mx-auto"]],
    ["margin-top", "10px", ["mt-2.5"]],
    ["margin-left", "-8px", ["-ml-2"]],
    ["gap", "12px", ["gap-3"]],
    ["width", "100%", ["w-full"]],
    ["width", "300px", ["w-[300px]"]],
    ["height", "100vh", ["h-screen"]],
    ["max-width", "640px", ["max-w-[640px]"]],
    ["font-size", "24px", ["text-2xl"]],
    ["font-size", "15px", ["text-[15px]"]],
    ["font-weight", "700", ["font-bold"]],
    ["color", "#ffffff", ["text-[#ffffff]"]],
    ["color", "white", ["text-white"]],
    ["background-color", "#0b0b1a", ["bg-[#0b0b1a]"]],
    ["border-radius", "8px", ["rounded-lg"]],
    ["border-radius", "9999px", ["rounded-full"]],
    ["border", "1px solid #ccc", ["border", "border-solid", "border-[#ccc]"]],
    ["opacity", "0.5", ["opacity-50"]],
    ["z-index", "10", ["z-10"]],
    ["text-align", "center", ["text-center"]],
    ["cursor", "pointer", ["cursor-pointer"]],
  ];
  it.each(cases)("%s: %s", (prop, value, expected) => {
    expect(declarationToClasses(prop, value)).toEqual(expected);
  });

  it("refuses what it cannot represent exactly", () => {
    expect(declarationToClasses("padding", "var(--gap)")).toBeNull();
    expect(declarationToClasses("width", "calc(100% - 20px)")).toBeNull();
    expect(declarationToClasses("color", "red !important")).toBeNull();
    expect(declarationToClasses("transform", "rotate(3deg)")).toBeNull();
    expect(declarationToClasses("padding", "1px 2px 3px 4px 5px")).toBeNull();
    expect(declarationToClasses("color", "red")).toBeNull();
  });
});

describe("cssToTailwind", () => {
  it("turns a plain rule into @apply and keeps what has no utility", () => {
    const r = cssToTailwind(".card {\n  display: flex;\n  padding: 16px;\n  box-shadow: 0 1px 2px #0003;\n}");
    expect(r.css).toBe(".card {\n  @apply flex p-4;\n  box-shadow: 0 1px 2px #0003;\n}");
    expect(r).toMatchObject({ converted: 2, kept: 1 });
  });

  it("leaves at-rules and their inner rules alone", () => {
    const css = "@media (min-width: 600px) {\n  .a { display: flex; }\n}\n@keyframes spin { from { opacity: 0; } to { opacity: 1; } }";
    const r = cssToTailwind(css);
    expect(r.css).toBe(css);
    expect(r.converted).toBe(0);
  });

  it("converts several rules and keeps selectors, comments and untouched rules", () => {
    const css = "/* base */\nbody { margin: 0; }\n\n.a:hover { color: white; }\n.b { transform: scale(2); }";
    const r = cssToTailwind(css);
    expect(r.css).toContain("/* base */\nbody {\n  @apply m-0;\n}");
    expect(r.css).toContain(".a:hover {\n  @apply text-white;\n}");
    expect(r.css).toContain(".b { transform: scale(2); }");
  });

  it("does not touch rules that already use @apply, and is idempotent", () => {
    const once = cssToTailwind(".x { display: flex; }").css;
    expect(cssToTailwind(once)).toMatchObject({ css: once, converted: 0 });
  });

  it("drops no declaration", () => {
    const css = ".x { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; --brand: red; }";
    const out = cssToTailwind(css).css;
    expect(out).toContain("grid-template-columns: 1fr 1fr;");
    expect(out).toContain("--brand: red;");
    expect(out).toContain("@apply grid gap-2;");
  });

  it("returns empty and unfinished CSS unchanged", () => {
    expect(cssToTailwind("").css).toBe("");
    expect(cssToTailwind(".a { display: flex;").css).toBe(".a { display: flex;");
  });
});
