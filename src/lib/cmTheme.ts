import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { Extension } from "@codemirror/state";

const c = {
  text: "#f1f0ff",
  coral: "#ff8a6b",
  aqua: "#4fd8f0",
  violet: "#b3a7ff",
  lemon: "#e8f76a",
  fade: "#8283b8",
};

const highlight = HighlightStyle.define([
  { tag: [t.tagName, t.keyword, t.controlKeyword, t.definitionKeyword], color: c.coral },
  { tag: [t.attributeName, t.propertyName, t.className], color: c.lemon },
  { tag: [t.string, t.attributeValue, t.regexp], color: c.aqua },
  { tag: [t.number, t.bool, t.atom, t.unit], color: c.violet },
  { tag: [t.comment, t.meta], color: c.fade, fontStyle: "italic" },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], color: c.violet },
  { tag: [t.punctuation, t.bracket, t.operator], color: "#c9c8ee" },
]);

const base = EditorView.theme({ "&": { color: c.text }, ".cm-content": { caretColor: c.aqua } }, { dark: true });

export const inkTheme: Extension = [base, syntaxHighlighting(highlight)];
