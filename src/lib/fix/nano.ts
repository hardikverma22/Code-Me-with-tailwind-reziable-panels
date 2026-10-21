import { ModelEngine, SYSTEM, START_TIMEOUT_MS, within, type ModelBackend } from "./model";
import { FixUnavailable } from "./types";

// The prompts, windows and answer handling are shared with every other model engine.
export * from "./model";

/**
 * Chrome's built-in model (Gemini Nano) through the Prompt API. It runs on this device: the code is
 * never sent to a server. The page is the only caller, so the sandboxed preview cannot reach it.
 * https://developer.chrome.com/docs/ai/prompt-api
 */
type Session = {
  prompt(input: string, options?: { responseConstraint?: unknown; signal?: AbortSignal }): Promise<string>;
  clone(): Promise<Session>;
  destroy(): void;
  measureInputUsage?(input: string): Promise<number>;
  inputQuota?: number;
};
type LanguageModelApi = {
  availability(options?: unknown): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options?: unknown): Promise<Session>;
};

const languageModel = () => (globalThis as { LanguageModel?: LanguageModelApi }).LanguageModel;
const LANGS = { expectedInputs: [{ type: "text", languages: ["en"] }], expectedOutputs: [{ type: "text", languages: ["en"] }] };

/** ready: usable now. downloadable: needs the user to start a one-time download. */
export type NanoState = "ready" | "downloadable" | "downloading" | "unavailable" | "missing";

export async function nanoState(): Promise<NanoState> {
  const api = languageModel();
  if (!api) return "missing";
  try {
    const a = await api.availability(LANGS);
    return a === "available" ? "ready" : a;
  } catch {
    return "unavailable";
  }
}

/** Without a way to measure tokens, stay well inside the smallest context windows seen. */
const FALLBACK_MAX_CHARS = 6000;

const STUCK = "Chrome's on-device model isn't responding. Restarting Chrome usually clears this.";

function backendFor(base: Session): ModelBackend {
  return {
    async open() {
      const session = await base.clone();
      const quota = session.inputQuota ?? base.inputQuota;
      return {
        async fits(prompt) {
          const used = await session.measureInputUsage?.(prompt);
          return used !== undefined && quota ? used <= quota * 0.75 : prompt.length <= FALLBACK_MAX_CHARS;
        },
        answer: (prompt, schema, signal) => session.prompt(prompt, { responseConstraint: schema, signal }),
        destroy: () => session.destroy(),
      };
    },
    destroy: () => base.destroy(),
  };
}

export class NanoEngine extends ModelEngine {
  private constructor(backend: ModelBackend) {
    super("nano", backend, { name: "on-device model", stuck: STUCK, summary: "Proposed by Chrome's on-device model." });
  }

  /** Creates the engine. When the model is not downloaded yet this starts the download, which needs a click. */
  static async create(onDownload?: (fraction: number) => void, signal?: AbortSignal): Promise<NanoEngine> {
    const api = languageModel();
    if (!api) throw new FixUnavailable("This browser has no built-in AI model.");
    try {
      // A first-time download can take a long time and is not a hang, so the clock waits while one is in progress.
      let downloading = false;
      const base = await within(
        new Promise<Session>((resolve, reject) => {
          api
            .create({
              ...LANGS,
              initialPrompts: [{ role: "system", content: SYSTEM }],
              signal,
              monitor(m: EventTarget) {
                m.addEventListener("downloadprogress", (e) => { downloading = true; onDownload?.((e as Event & { loaded: number }).loaded); });
              },
            })
            .then(resolve, reject);
        }),
        START_TIMEOUT_MS,
        STUCK,
        () => downloading
      );
      return new NanoEngine(backendFor(base));
    } catch (e) {
      if (e instanceof FixUnavailable || (e instanceof DOMException && e.name === "AbortError")) throw e;
      throw new FixUnavailable(e instanceof Error && e.name === "NotAllowedError" ? "Chrome needs a click to download the model." : "The on-device model could not start.");
    }
  }
}
