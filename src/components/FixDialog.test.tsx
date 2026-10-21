import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, vi } from "vitest";
import type { A11yFinding } from "../lib/a11y";
import { fakeInspect } from "../lib/fix/fakeInspect";
import type { Problem } from "../lib/fix/types";
import { useProject } from "../store/project";

// The real sandbox needs a browser; this stand-in runs the real checker on the page's HTML and CSS.
vi.mock("../lib/fix/inspect", () => ({ inspectPage: (sources: Parameters<typeof fakeInspect>[0]) => fakeInspect(sources) }));

import FixDialog from "./FixDialog";

/** Opens the dialog on whatever the saved project holds, the way the editor's console panel does. */
function Harness({ problem, onClose }: { problem: Problem; onClose: () => void }) {
  const { html, css, js } = useProject.getState();
  return (
    <FixDialog
      problem={problem}
      sources={{ html, css, js, tailwind: false, resources: [] }}
      getCurrent={() => { const c = useProject.getState(); return { html: c.html, css: c.css, js: c.js }; }}
      onApply={(patch) => { const { setCode } = useProject.getState(); for (const l of ["html", "css", "js"] as const) setCode(l, patch[l]); }}
      onClose={onClose}
    />
  );
}

const setPage = (html: string, css = "", js = "") =>
  useProject.setState({ html, css, js, tailwind: false, resources: [], parentSlug: null, forkedFrom: null });

async function problemFor(rule: A11yFinding["rule"]): Promise<Problem> {
  const { html, css, js } = useProject.getState();
  const report = await fakeInspect({ html, css, js, tailwind: false, resources: [] });
  const finding = report.findings.find((f) => f.rule === rule);
  if (!finding) throw new Error(`setup: no ${rule} finding`);
  return { type: "a11y", finding };
}

const installModel = (answer: object, availability = "available") => {
  const session = {
    prompt: vi.fn(async () => JSON.stringify(answer)),
    clone: async () => session,
    destroy: vi.fn(),
    measureInputUsage: async () => 50,
    inputQuota: 4000,
  };
  (globalThis as { LanguageModel?: unknown }).LanguageModel = { availability: async () => availability, create: async () => session };
  return session;
};

beforeEach(() => {
  delete (globalThis as { LanguageModel?: unknown }).LanguageModel;
});

describe("FixDialog", () => {
  it("shows a rule-based fix that was checked, and applies it", async () => {
    setPage('<h1>Join</h1>\n<input type="email">');
    const onClose = vi.fn();
    render(<Harness problem={await problemFor("form-label")} onClose={onClose} />);

    expect(await screen.findByText(/Checked in a sandbox/)).toBeTruthy();
    const diff = screen.getByLabelText("html changes");
    expect(within(diff).getByText(/<label for="email">Email<\/label>/)).toBeTruthy();
    expect(screen.getByText(/Rules/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Apply fix/ }));
    expect(useProject.getState().html).toBe('<h1>Join</h1>\n<label for="email">Email</label>\n<input type="email" id="email">');
    expect(onClose).toHaveBeenCalled();
  });

  it("refuses to apply when the editors changed while the dialog was open", async () => {
    setPage('<input type="email">');
    const onClose = vi.fn();
    render(<Harness problem={await problemFor("form-label")} onClose={onClose} />);
    await screen.findByText(/Checked in a sandbox/);

    useProject.setState({ html: '<input type="email"><p>I kept typing</p>' });
    fireEvent.click(screen.getByRole("button", { name: /Apply fix/ }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/Your code changed/);
    expect(useProject.getState().html).toBe('<input type="email"><p>I kept typing</p>');
    expect(onClose).not.toHaveBeenCalled();
  });

  it("says plainly when no rule applies and the browser has no model", async () => {
    setPage('<button><svg width="8" height="8"></svg></button>');
    render(<Harness problem={await problemFor("button-name")} onClose={() => {}} />);
    expect(await screen.findByText(/No rule covers this one/)).toBeTruthy();
    expect(await screen.findByText(/doesn't have/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /on-device AI/ })).toBeNull();
    expect(useProject.getState().html).toContain("<svg");
  });

  it("offers the on-device model only after rules fail, and nothing runs until it is asked", async () => {
    const session = installModel({ tab: "html", code: '<button aria-label="Close"><svg width="8" height="8"></svg></button>' });
    setPage('<button><svg width="8" height="8"></svg></button>');
    render(<Harness problem={await problemFor("button-name")} onClose={() => {}} />);

    const ask = await screen.findByRole("button", { name: /Try on-device AI/ });
    expect(screen.getByText(/your code is not sent anywhere/)).toBeTruthy();
    expect(session.prompt).not.toHaveBeenCalled();

    fireEvent.click(ask);
    expect(await screen.findByText(/Checked in a sandbox/)).toBeTruthy();
    expect(screen.getByText(/on-device model/)).toBeTruthy();
    expect(screen.getByText(/Gemini Nano/)).toBeTruthy();
    expect(session.prompt).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /Apply fix/ }));
    expect(useProject.getState().html).toContain('aria-label="Close"');
  });

  it("does not offer a model fix that fails the check, and lets the user try again", async () => {
    // The model "fixes" nothing: it hands back the same HTML, which the guard turns down.
    const html = '<button><svg width="8" height="8"></svg></button>';
    installModel({ tab: "html", code: html });
    setPage(html);
    render(<Harness problem={await problemFor("button-name")} onClose={() => {}} />);
    fireEvent.click(await screen.findByRole("button", { name: /Try on-device AI/ }));

    await waitFor(() => expect(screen.getByText(/The fix changed nothing/)).toBeTruthy());
    expect(screen.queryByRole("button", { name: /Apply fix/ })).toBeNull();
    expect(screen.getByRole("button", { name: /Try Gemini Nano again/ })).toBeTruthy();
    expect(useProject.getState().html).toBe(html);
  });

  it("explains a first-time download before it starts", async () => {
    installModel({ tab: "html", code: "" }, "downloadable");
    setPage('<button><svg width="8" height="8"></svg></button>');
    render(<Harness problem={await problemFor("button-name")} onClose={() => {}} />);
    expect(await screen.findByRole("button", { name: /Download on-device AI and try/ })).toBeTruthy();
    expect(screen.getByText(/downloads the model once/)).toBeTruthy();
  });
});
