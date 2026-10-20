import { templates } from "./templates";

describe("templates", () => {
  it("have unique ids", () => {
    expect(new Set(templates.map((t) => t.id)).size).toBe(templates.length);
  });
  it("only use external resources the share endpoint accepts (https, max 5)", () => {
    for (const t of templates) {
      const r = t.resources ?? [];
      expect(r.length).toBeLessThanOrEqual(5);
      for (const x of r) expect(x.url).toMatch(/^https:\/\/[^\s"<>]+$/);
    }
  });
});
