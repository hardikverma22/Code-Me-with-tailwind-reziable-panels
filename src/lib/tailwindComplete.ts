import type { CompletionContext, CompletionResult } from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { classOptions, classTokenAt } from "./tailwind";

/** Suggests Tailwind classes while typing inside `class="..."` in the HTML tab. */
export function tailwindSource(context: CompletionContext): CompletionResult | null {
  const hit = classTokenAt(context.state.doc.toString(), context.pos);
  if (!hit) return null;
  const { keep, options } = classOptions(hit.token);
  if (options.length === 0 && !context.explicit) return null;
  return {
    from: hit.from + keep,
    options: options.map((label) => ({ label, type: label.endsWith(":") ? "keyword" : "class" })),
    validFor: /^[\w\-./[\]%#]*$/,
  };
}

/** Registers the source next to HTML's own tag and attribute completion (the editor's default setup supplies the popup). */
export const tailwindCompletion = EditorState.languageData.of(() => [{ autocomplete: tailwindSource }]);
