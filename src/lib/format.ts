export type Language = "html" | "css" | "js";

const parsers: Record<Language, string> = { html: "html", css: "css", js: "babel" };

/** Formats code with Prettier (loaded on first use). Returns the original text if it can't be parsed. */
export async function formatCode(code: string, language: Language): Promise<string> {
  try {
    const [{ format }, babel, estree, html, postcss] = await Promise.all([
      import("prettier/standalone"),
      import("prettier/plugins/babel"),
      import("prettier/plugins/estree"),
      import("prettier/plugins/html"),
      import("prettier/plugins/postcss"),
    ]);
    return await format(code, {
      parser: parsers[language],
      plugins: [babel, estree, html, postcss],
      tabWidth: 2,
    });
  } catch {
    return code;
  }
}
