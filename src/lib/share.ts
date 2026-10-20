import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Sources } from "./buildSrcDoc";

const KEY = "#code=";

export function encodeShare(sources: Sources): string {
  return KEY + compressToEncodedURIComponent(JSON.stringify(sources));
}

export function decodeShare(hash: string): Sources | null {
  if (!hash.startsWith(KEY)) return null;
  try {
    const raw = decompressFromEncodedURIComponent(hash.slice(KEY.length));
    const data = raw ? JSON.parse(raw) : null;
    if (data && ["html", "css", "js"].every((k) => typeof data[k] === "string")) {
      return { html: data.html, css: data.css, js: data.js };
    }
  } catch {
    /* fall through */
  }
  return null;
}
