import { useCallback } from "react";
import PreviewFrame from "./PreviewFrame";
import ProofSheet from "./ProofSheet";
import ReferenceOverlay from "./ReferenceOverlay";
import { useProject } from "../store/project";
import { useConsole } from "../store/console";
import { useA11y } from "../store/a11y";
import type { PreviewMessage } from "../lib/buildSrcDoc";

export default function Preview() {
  const html = useProject((s) => s.html);
  const css = useProject((s) => s.css);
  const js = useProject((s) => s.js);
  const tailwind = useProject((s) => s.tailwind);
  const resources = useProject((s) => s.resources);
  const { push, clear } = useConsole();
  const setFindings = useA11y((s) => s.set);
  const resetFindings = useA11y((s) => s.reset);
  const onMessage = useCallback(
    (m: PreviewMessage) => (m.kind === "a11y" ? setFindings(m.findings) : push(m.kind, m.args)),
    [push, setFindings]
  );
  const onRun = useCallback(() => { clear(); resetFindings(); }, [clear, resetFindings]);

  return (
    <ProofSheet className="h-full w-full">
      <PreviewFrame sources={{ html, css, js, tailwind, resources }} onMessage={onMessage} onRun={onRun} className="h-full w-full bg-white" />
      <ReferenceOverlay />
    </ProofSheet>
  );
}
