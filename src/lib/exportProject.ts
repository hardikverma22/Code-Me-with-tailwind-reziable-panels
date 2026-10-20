import { strToU8, zipSync } from "fflate";
import { TAILWIND_SRC, type Sources } from "./buildSrcDoc";

/** Downloads the project as a small static site: index.html, style.css, script.js. */
export function exportProject({ html, css, js, tailwind, resources = [] }: Sources) {
  const ext = resources.map((r) => (r.kind === "style" ? `<link rel="stylesheet" href="${r.url}" />` : `<script src="${r.url}"></script>`)).join("\n");
  const index = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CodeMe project</title>
${ext}
${tailwind ? `<script src="${TAILWIND_SRC}"></script>\n<style type="text/tailwindcss">\n@import "./style.css";\n</style>` : `<link rel="stylesheet" href="style.css" />`}
</head>
<body>
${html}
<script src="script.js"></script>
</body>
</html>
`;
  const readme = `Exported from CodeMe.\nOpen index.html in a browser.${tailwind ? "\nTailwind runs through its browser build, which is meant for development. Build with the Tailwind CLI for production." : ""}\n`;
  const zip = zipSync({
    "index.html": strToU8(index),
    "style.css": strToU8(css),
    "script.js": strToU8(js),
    "README.txt": strToU8(readme),
  });
  const url = URL.createObjectURL(new Blob([zip.buffer as ArrayBuffer], { type: "application/zip" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "codeme-project.zip";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
