import { useCallback } from "react";
import PreviewFrame from "./PreviewFrame";
import ProofSheet from "./ProofSheet";
import { useProject } from "../store/project";
import { useConsole } from "../store/console";

export default function Preview() {
  const html = useProject((s) => s.html);
  const css = useProject((s) => s.css);
  const js = useProject((s) => s.js);
  const tailwind = useProject((s) => s.tailwind);
  const resources = useProject((s) => s.resources);
  const { push, clear } = useConsole();
  const onMessage = useCallback((m: { kind: Parameters<typeof push>[0]; args: string[] }) => push(m.kind, m.args), [push]);
  const onRun = useCallback(() => clear(), [clear]);

  return (
    <ProofSheet className="h-full w-full">
      <PreviewFrame sources={{ html, css, js, tailwind, resources }} onMessage={onMessage} onRun={onRun} className="h-full w-full bg-white" />
    </ProofSheet>
  );
}
