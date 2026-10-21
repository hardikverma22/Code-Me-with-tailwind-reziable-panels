import { SANDBOX } from "../../components/PreviewFrame";
import { buildSrcDoc, type Sources } from "../buildSrcDoc";
import type { PageReport } from "./types";

/**
 * Runs a page in a hidden frame with the same sandbox as the preview, and reports what it did:
 * the accessibility findings the page's own checker posts, and any runtime errors.
 * The frame lives in the app's document, so it must stay sandboxed without allow-same-origin.
 */
export function inspectPage(sources: Sources, timeoutMs = 6000, signal?: AbortSignal): Promise<PageReport> {
  return new Promise((resolve, reject) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("sandbox", SANDBOX);
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.title = "Fix check";
    frame.style.cssText = "position:fixed;left:-9999px;top:0;width:800px;height:600px;border:0;pointer-events:none";

    const errors: string[] = [];
    const done = (findings: PageReport["findings"], completed: boolean) => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      signal?.removeEventListener("abort", onAbort);
      frame.remove();
      resolve({ findings, errors, completed });
    };
    const onAbort = () => {
      clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      frame.remove();
      reject(new DOMException("Aborted", "AbortError"));
    };
    function onMessage(e: MessageEvent) {
      // Only this frame: the visible preview posts the same kind of messages.
      if (e.source !== frame.contentWindow || e.data?.source !== "codeme-preview") return;
      if (e.data.kind === "error") errors.push(String(e.data.args?.join(" ") ?? ""));
      else if (e.data.kind === "a11y") done(e.data.findings ?? [], true);
    }

    // A page that hangs is reported as incomplete, never as clean: a fix must not pass by breaking the page.
    const timer = setTimeout(() => done([], false), timeoutMs);
    window.addEventListener("message", onMessage);
    signal?.addEventListener("abort", onAbort);
    frame.srcdoc = buildSrcDoc(sources);
    document.body.append(frame);
  });
}
