export type Sources = { html: string; css: string; js: string };

/** Posted by the preview iframe to the parent window. */
export type PreviewMessage = {
  source: "codeme-preview";
  kind: "log" | "info" | "warn" | "error" | "debug";
  args: string[];
};

// Runs inside the sandboxed iframe: forwards console output and uncaught errors to the parent.
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
  window.addEventListener("error", (e) => send("error", [e.message + (e.lineno ? ` (line ${e.lineno})` : "")]));
  window.addEventListener("unhandledrejection", (e) => send("error", ["Unhandled rejection: " + String(e.reason)]));
}.toString()})();`;

// Keep user code from closing our tags early.
const escapeClose = (code: string, tag: "script" | "style") =>
  code.replace(new RegExp(`</${tag}`, "gi"), `<\\/${tag}`);

export function buildSrcDoc({ html, css, js }: Sources): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script>${bridge}</script>
<style>${escapeClose(css, "style")}</style>
</head>
<body>
${html}
<script>${escapeClose(js, "script")}</script>
</body>
</html>`;
}
