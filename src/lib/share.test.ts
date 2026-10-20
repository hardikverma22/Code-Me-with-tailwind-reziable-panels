import { decodeShare, encodeShare } from "./share";
import { buildSrcDoc } from "./buildSrcDoc";

const sources = { html: "<h1>Hi</h1>", css: "h1{color:red}", js: "console.log('x')" };

describe("share", () => {
  it("round-trips sources through the URL hash", () => {
    expect(decodeShare(encodeShare(sources))).toEqual(sources);
  });
  it("returns null for junk", () => {
    expect(decodeShare("#code=%%%")).toBeNull();
    expect(decodeShare("#other")).toBeNull();
  });
});

describe("buildSrcDoc", () => {
  it("keeps user scripts from closing the tag early", () => {
    const doc = buildSrcDoc({ ...sources, js: "const s = '</script>'" });
    expect(doc).not.toContain("'</script>'");
  });
});

import { slugFromPath } from "./route";
describe("slugFromPath", () => {
  it("reads project slugs", () => {
    expect(slugFromPath("/p/abc23xyz")).toBe("abc23xyz");
    expect(slugFromPath("/")).toBeNull();
    expect(slugFromPath("/p/a/b")).toBeNull();
  });
});
