import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Sources } from "../lib/buildSrcDoc";
import type { Language } from "../lib/format";
import { exampleSources } from "../lib/example";

type ProjectState = Sources & {
  /** Slug of the shared project this work was opened or shared from. */
  parentSlug: string | null;
  setCode: (language: Language, code: string) => void;
  load: (sources: Sources, parentSlug?: string | null) => void;
  reset: () => void;
  loadExample: () => void;
};

const empty: Sources = { html: "", css: "", js: "" };

export const useProject = create<ProjectState>()(
  persist(
    (set) => ({
      ...exampleSources,
      parentSlug: null,
      setCode: (language, code) => set({ [language]: code }),
      load: (sources, parentSlug = null) => set({ ...sources, parentSlug }),
      reset: () => set({ ...empty, parentSlug: null }),
      loadExample: () => set({ ...exampleSources, parentSlug: null }),
    }),
    {
      name: "codeme-project",
      partialize: ({ html, css, js, parentSlug }) => ({ html, css, js, parentSlug }),
    }
  )
);
