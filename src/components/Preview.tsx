import { useEffect, useMemo, useState } from "react";
import { buildSrcDoc, type PreviewMessage } from "../lib/buildSrcDoc";
import { useProject } from "../store/project";
import { useConsole } from "../store/console";

const DEBOUNCE_MS = 400;

export default function Preview() {
  const html = useProject((s) => s.html);
  const css = useProject((s) => s.css);
  const js = useProject((s) => s.js);
  const [sources, setSources] = useState({ html, css, js });
  const { push, clear } = useConsole();

  useEffect(() => {
    const t = setTimeout(() => setSources({ html, css, js }), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [html, css, js]);

  // A fresh run starts with an empty console.
  const srcDoc = useMemo(() => buildSrcDoc(sources), [sources]);
  useEffect(() => clear(), [srcDoc, clear]);

  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessage>) => {
      if (e.data?.source === "codeme-preview") push(e.data.kind, e.data.args);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [push]);

  return (
    <iframe
      title="Preview"
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-modals allow-forms"
      className="h-full w-full bg-white"
    />
  );
}
