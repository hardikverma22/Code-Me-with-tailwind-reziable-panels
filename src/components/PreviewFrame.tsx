import { useEffect, useMemo, useState } from "react";
import { buildSrcDoc, type PreviewMessage, type Sources } from "../lib/buildSrcDoc";

type Props = {
  sources: Sources;
  debounceMs?: number;
  onMessage?: (message: PreviewMessage) => void;
  /** Fires with the new document each time the frame is about to re-run. */
  onRun?: () => void;
  interactive?: boolean;
  className?: string;
  title?: string;
};

export default function PreviewFrame({
  sources, debounceMs = 400, onMessage, onRun, interactive = true, className, title = "Preview",
}: Props) {
  const [settled, setSettled] = useState(sources);

  useEffect(() => {
    const t = setTimeout(() => setSettled(sources), debounceMs);
    return () => clearTimeout(t);
  }, [sources, debounceMs]);

  const srcDoc = useMemo(() => buildSrcDoc(settled), [settled]);

  useEffect(() => {
    onRun?.();
  }, [srcDoc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!onMessage) return;
    const handler = (e: MessageEvent<PreviewMessage>) => {
      if (e.data?.source === "codeme-preview") onMessage(e.data);
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onMessage]);

  return (
    <iframe
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-scripts allow-modals allow-forms"
      className={className}
      style={interactive ? undefined : { pointerEvents: "none" }}
    />
  );
}
