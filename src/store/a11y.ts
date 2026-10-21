import { create } from "zustand";
import type { A11yFinding } from "../lib/a11y";

type A11yState = {
  /** null while the preview is (re)loading and the check has not reported yet. */
  findings: A11yFinding[] | null;
  set: (findings: A11yFinding[]) => void;
  reset: () => void;
};

export const useA11y = create<A11yState>((set) => ({
  findings: null,
  set: (findings) => set({ findings }),
  reset: () => set({ findings: null }),
}));
