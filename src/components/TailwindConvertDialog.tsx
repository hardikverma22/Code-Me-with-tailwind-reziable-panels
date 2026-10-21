import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { useProject } from "../store/project";
import { cssToTailwind } from "../lib/tailwind";
import Modal from "./Modal";

/** Previews the CSS tab rewritten as `@apply` rules, then applies it only on request. */
export default function TailwindConvertDialog({ onClose }: { onClose: () => void }) {
  const css = useProject((s) => s.css);
  const setCode = useProject((s) => s.setCode);
  const result = useMemo(() => cssToTailwind(css), [css]);
  const [copied, setCopied] = useState(false);
  const nothing = result.converted === 0;

  const apply = () => { setCode("css", result.css); onClose(); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(result.css); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };
  const btn = "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors";

  return (
    <Modal
      title="Convert CSS to Tailwind"
      onClose={onClose}
      wide
      footer={
        <>
          <button onClick={copy} disabled={nothing} className={`${btn} text-fade hover:text-paper disabled:opacity-40`}>
            {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />} {copied ? "Copied" : "Copy"}
          </button>
          <button onClick={onClose} className={`${btn} text-fade hover:text-paper`}>Cancel</button>
          <button onClick={apply} disabled={nothing} className={`${btn} bg-paper text-ink disabled:opacity-40`}>Replace CSS</button>
        </>
      }
    >
      <p className="mb-3 text-sm text-fade" role="status">
        {nothing
          ? "Nothing to convert. Only plain rules with common properties (layout, spacing, size, type, colour, border) are turned into utilities."
          : <>Converted <b className="text-paper">{result.converted}</b> {result.converted === 1 ? "declaration" : "declarations"} to <code className="text-css">@apply</code>.
              {result.kept > 0 && <> <b className="text-paper">{result.kept}</b> with no utility stay as CSS.</>} Media queries and keyframes are left as they are.</>}
      </p>
      <pre className="overflow-auto rounded-lg bg-bench p-4 font-mono text-xs leading-5" aria-label="Converted CSS">{result.css || " "}</pre>
    </Modal>
  );
}
