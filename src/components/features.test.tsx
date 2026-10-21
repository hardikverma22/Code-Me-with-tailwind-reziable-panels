import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const query = vi.fn();
vi.mock("../lib/convex", () => ({ convex: { query: (...a: unknown[]) => query(...a) } }));

import DiffDialog from "./DiffDialog";
import ReferenceOverlay from "./ReferenceOverlay";
import ConsolePanel from "./ConsolePanel";
import TailwindConvertDialog from "./TailwindConvertDialog";
import { useProject } from "../store/project";
import { useA11y } from "../store/a11y";

const snapshot = (over: Partial<Record<"slug" | "html" | "css" | "js", string>> = {}) => ({
  slug: "parent1", html: "<p>old</p>\n<p>same</p>", css: "a { color: red; }", js: "", tailwind: false, resources: [], forkedFrom: null, ...over,
});

beforeEach(() => {
  query.mockReset();
  useA11y.getState().reset();
  useProject.setState({ html: "<p>new</p>\n<p>same</p>", css: "a { color: red; }", js: "", tailwind: false, resources: [], parentSlug: "parent1", forkedFrom: "grand0" });
});

describe("DiffDialog", () => {
  it("shows what changed against the link the work came from", async () => {
    query.mockResolvedValue(snapshot());
    render(<DiffDialog onClose={() => {}} />);
    expect(screen.getByRole("status").textContent).toMatch(/loading/i);
    const diff = await screen.findByLabelText("html changes");
    expect(within(diff).getByText("<p>old</p>")).toBeTruthy();
    expect(within(diff).getByText("<p>new</p>")).toBeTruthy();
    expect(query).toHaveBeenCalledWith(expect.anything(), { slug: "parent1" });
  });

  it("says so when nothing changed", async () => {
    query.mockResolvedValue(snapshot({ html: "<p>new</p>\n<p>same</p>" }));
    render(<DiffDialog onClose={() => {}} />);
    expect(await screen.findByText(/No changes\. Your work matches/)).toBeTruthy();
  });

  it("can compare with the project the link was forked from", async () => {
    query.mockResolvedValue(snapshot());
    render(<DiffDialog onClose={() => {}} />);
    await screen.findByLabelText("html changes");
    fireEvent.click(screen.getByRole("button", { name: /forked from \/p\/grand0/ }));
    await waitFor(() => expect(query).toHaveBeenLastCalledWith(expect.anything(), { slug: "grand0" }));
  });

  it("reports a failed or missing snapshot", async () => {
    query.mockRejectedValue(new Error("offline"));
    render(<DiffDialog onClose={() => {}} />);
    expect((await screen.findByRole("alert")).textContent).toMatch(/Couldn't load/);
  });

  it("closes on Escape", async () => {
    query.mockResolvedValue(snapshot());
    const onClose = vi.fn();
    render(<DiffDialog onClose={onClose} />);
    await screen.findByLabelText("html changes");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});

describe("ReferenceOverlay", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:ref");
    URL.revokeObjectURL = vi.fn();
  });
  const pick = (file: File) => fireEvent.change(screen.getByLabelText("Reference image"), { target: { files: [file] } });

  it("shows a chosen image over the preview and switches modes", () => {
    render(<ReferenceOverlay />);
    expect(screen.queryByTestId("reference-image")).toBeNull();
    pick(new File(["x"], "ref.png", { type: "image/png" }));
    const img = screen.getByTestId("reference-image");
    expect(img.style.opacity).toBe("0.5");
    fireEvent.click(screen.getByRole("button", { name: "Split" }));
    expect(img.style.clipPath).toContain("inset");
    fireEvent.click(screen.getByRole("button", { name: "Difference" }));
    expect(img.style.mixBlendMode).toBe("difference");
    fireEvent.click(screen.getByRole("button", { name: "Remove reference image" }));
    expect(screen.queryByTestId("reference-image")).toBeNull();
  });

  it("refuses SVG and other non-raster files", () => {
    render(<ReferenceOverlay />);
    pick(new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }));
    expect(screen.getByRole("alert").textContent).toMatch(/PNG, JPEG/);
    expect(screen.queryByTestId("reference-image")).toBeNull();
  });
});

describe("ConsolePanel accessibility tab", () => {
  const finding = { rule: "img-alt" as const, severity: "error" as const, message: "Image has no alt attribute.", snippet: "<img src=a>", tag: "img", id: null, tagIndex: 0, tagCount: 1 };

  it("waits for the check, then lists findings with their HTML line", () => {
    useProject.setState({ html: "<h1>x</h1>\n<img src=a>" });
    render(<ConsolePanel />);
    fireEvent.click(screen.getByRole("tab", { name: /Accessibility/ }));
    expect(screen.getByText(/Checking the page/)).toBeTruthy();
    useA11y.getState().set([finding]);
    return waitFor(() => {
      expect(screen.getByText("Image has no alt attribute.")).toBeTruthy();
      expect(screen.getByText(/img-alt · HTML line 2/)).toBeTruthy();
      expect(screen.getByLabelText("1 issue")).toBeTruthy();
    });
  });

  it("celebrates nothing: a clean result carries its limits", () => {
    useA11y.getState().set([]);
    render(<ConsolePanel />);
    fireEvent.click(screen.getByRole("tab", { name: /Accessibility/ }));
    expect(screen.getByText(/not a full audit/)).toBeTruthy();
  });
});

describe("TailwindConvertDialog", () => {
  it("previews, then replaces the CSS only when asked", () => {
    useProject.setState({ css: ".a { display: flex; padding: 8px; }" });
    const onClose = vi.fn();
    render(<TailwindConvertDialog onClose={onClose} />);
    expect(screen.getByLabelText("Converted CSS").textContent).toMatch("@apply flex p-2;");
    expect(useProject.getState().css).toBe(".a { display: flex; padding: 8px; }");
    fireEvent.click(screen.getByRole("button", { name: "Replace CSS" }));
    expect(useProject.getState().css).toBe(".a {\n  @apply flex p-2;\n}");
    expect(onClose).toHaveBeenCalled();
  });

  it("disables replacing when nothing converts", () => {
    useProject.setState({ css: ".a { transform: scale(2); }" });
    render(<TailwindConvertDialog onClose={() => {}} />);
    expect((screen.getByRole("button", { name: "Replace CSS" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
