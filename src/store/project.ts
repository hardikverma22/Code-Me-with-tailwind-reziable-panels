import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Sources } from "../lib/buildSrcDoc";
import type { Language } from "../lib/format";
import { exampleSources } from "../lib/example";

type ProjectState = Sources & {
  setCode: (language: Language, code: string) => void;
  load: (sources: Sources) => void;
  reset: () => void;
  loadExample: () => void;
};

const empty: Sources = { html: "", css: "", js: "" };

export const useProject = create<ProjectState>()(
  persist(
    (set) => ({
      ...exampleSources,
      setCode: (language, code) => set({ [language]: code }),
      load: (sources) => set(sources),
      reset: () => set(empty),
      loadExample: () => set(exampleSources),
    }),
    {
      name: "codeme-project",
      partialize: ({ html, css, js }) => ({ html, css, js }),
    }
  )
);
