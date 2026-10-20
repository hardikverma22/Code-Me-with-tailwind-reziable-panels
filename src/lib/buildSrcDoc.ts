export type Sources = { html: string; css: string; js: string; tailwind?: boolean };

/** Posted by the preview iframe to the parent window. */
export type PreviewMessage = {
  source: "codeme-preview";
  kind: "log" | "info" | "warn" | "error" | "debug";
  args: string[];
};

/** Tailwind's browser build, pinned. It is meant for development, so the editor says so. */
export const TAILWIND_SRC = "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4.1.11";

const MARK = "/*__CODEME_JS__*/";

// Runs inside the sandboxed iframe: forwards console output and uncaught errors to the parent.
// Errors are reported against the user's JavaScript line, not the generated document's.
const bridge = `(${function () {
  const send = (kind: string, args: unknown[]) => {
    const text = args.map((a) => {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === "object" && a !== null) {
        try { return JSON.stringify(a, null, 2); } catch { return String(a); }
      }
      return String(a);
    });
    parent.postMessage({ source: "codeme-preview", kind, args: text }, "*");
  };
  (["log", "info", "warn", "error", "debug"] as const).forEach((kind) => {
    const original = console[kind];
    console[kind] = (...args: unknown[]) => {
      send(kind, args);
      original.apply(console, args);
    };
  });
  const offset = (window as unknown as { __jsOffset?: number }).__jsOffset ?? 0;
  window.addEventListener("error", (e) => {
    const where = e.lineno && e.lineno > offset ? ` (JS line ${e.lineno - offset})` : "";
    send("error", [e.message + where]);
  });
  window.addEventListener("unhandledrejection", (e) => send("error", ["Unhandled rejection: " + String(e.reason)]));
}.toString()})();`;

// Keep user code from closing our tags early.
const escapeClose = (code: string, tag: "script" | "style") =>
  code.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);

export function buildSrcDoc({ html, css, js, tailwind }: Sources): string {
  const tw = tailwind ? `<script src="${TAILWIND_SRC}"></script>\n` : "";
  const style = tailwind
    ? `<style type="text/tailwindcss">${escapeClose(css, "style")}</style>`
    : `<style>${escapeClose(css, "style")}</style>`;
  const doc = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script>%OFFSET%</script>
<script>${bridge}</script>
${tw}${style}
</head>
<body>
${html}
<script>${MARK}${escapeClose(js, "script")}</script>
</body>
</html>`;
  // Lines before the user's JavaScript start; used to report errors against the user's own line numbers.
  const before = doc.slice(0, doc.indexOf(MARK));
  const offset = before.split("\n").length - 1;
  return doc.replace("%OFFSET%", `window.__jsOffset=${offset}`).replace(MARK, "");
}
