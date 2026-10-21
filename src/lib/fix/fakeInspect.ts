import { runA11yChecks } from "../a11y";
import type { Sources } from "../buildSrcDoc";
import type { PageReport } from "./types";

/**
 * Test stand-in for the sandboxed check: renders the page's HTML and CSS in a real (jsdom) iframe document
 * and runs the real accessibility checker on it. It cannot run JavaScript, so it reports no runtime errors.
 */
export async function fakeInspect(sources: Sources): Promise<PageReport> {
  const frame = document.createElement("iframe");
  document.body.append(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html><head><style>${sources.css}</style></head><body>${sources.html}</body></html>`);
  doc.close();
  const findings = runA11yChecks(doc);
  frame.remove();
  return { findings, errors: [], completed: true };
}
