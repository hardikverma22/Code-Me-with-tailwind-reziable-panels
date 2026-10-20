import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Sources } from "../lib/buildSrcDoc";

export type SavedProject = Sources & { slug: string; title: string; createdAt: number };

type MineState = {
  items: SavedProject[];
  add: (project: SavedProject) => void;
  remove: (slug: string) => void;
};

const MAX_ITEMS = 60;

/** A readable name taken from the first heading or title in the HTML. */
export function titleFromHtml(html: string): string {
  const m = /<(h1|h2|title)[^>]*>([\s\S]*?)<\/\1>/i.exec(html);
  const text = m?.[2].replace(/<[^>]+>/g, "").trim();
  return text ? text.slice(0, 48) : "Untitled";
}

// "My work" lives on this device until accounts exist.
export const useMine = create<MineState>()(
  persist(
    (set) => ({
      items: [],
      add: (project) =>
        set((s) => ({ items: [project, ...s.items.filter((i) => i.slug !== project.slug)].slice(0, MAX_ITEMS) })),
      remove: (slug) => set((s) => ({ items: s.items.filter((i) => i.slug !== slug) })),
    }),
    { name: "codeme-mine" }
  )
);
