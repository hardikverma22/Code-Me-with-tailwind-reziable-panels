import { create } from "zustand";
import type { PreviewMessage } from "../lib/buildSrcDoc";

export type ConsoleEntry = { id: number; kind: PreviewMessage["kind"]; text: string };

type ConsoleState = {
  entries: ConsoleEntry[];
  push: (kind: PreviewMessage["kind"], args: string[]) => void;
  clear: () => void;
};

const MAX_ENTRIES = 500;
let nextId = 0;

export const useConsole = create<ConsoleState>((set) => ({
  entries: [],
  push: (kind, args) =>
    set((s) => ({
      entries: [...s.entries, { id: nextId++, kind, text: args.join(" ") }].slice(-MAX_ENTRIES),
    })),
  clear: () => set({ entries: [] }),
}));
