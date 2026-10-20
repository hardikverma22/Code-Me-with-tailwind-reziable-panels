import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Sources } from "../lib/buildSrcDoc";
import type { Language } from "../lib/format";
import { exampleSources } from "../lib/example";

type ProjectState = Sources & {
  /** Slug of the shared project this work was opened or shared from. */
  parentSlug: string | null;
  /** The project that `parentSlug` itself was forked from, for the lineage chip. */
  forkedFrom: string | null;
  setTailwind: (on: boolean) => void;
  setCode: (language: Language, code: string) => void;
  load: (sources: Sources, parentSlug?: string | null, forkedFrom?: string | null) => void;
  reset: () => void;
  loadExample: () => void;
};

const empty: Sources = { html: "", css: "", js: "", tailwind: false };

export const useProject = create<ProjectState>()(
  persist(
    (set) => ({
      ...exampleSources,
      parentSlug: null,
      forkedFrom: null,
      tailwind: false,
      setTailwind: (on) => set({ tailwind: on }),
      setCode: (language, code) => set({ [language]: code }),
      load: (sources, parentSlug = null, forkedFrom = null) => set({ tailwind: false, ...sources, parentSlug, forkedFrom }),
      reset: () => set({ ...empty, parentSlug: null, forkedFrom: null }),
      loadExample: () => set({ ...exampleSources, tailwind: false, parentSlug: null, forkedFrom: null }),
    }),
    {
      name: "codeme-project",
      partialize: ({ html, css, js, tailwind, parentSlug, forkedFrom }) => ({ html, css, js, tailwind, parentSlug, forkedFrom }),
    }
  )
);
