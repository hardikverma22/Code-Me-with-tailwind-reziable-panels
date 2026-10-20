import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { inkTheme } from "../lib/cmTheme";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import { abbreviationTracker, expandAbbreviation } from "@emmetio/codemirror6-plugin";
import type { Language } from "../lib/format";

type Props = { language: Language; value: string; onChange: (value: string) => void };

export default function Editor({ language, value, onChange }: Props) {
  const extensions = useMemo(() => {
    if (language === "js") return [inkTheme, javascript()];
    const emmet = [
      abbreviationTracker(),
      Prec.highest(keymap.of([{ key: "Tab", run: expandAbbreviation }])),
    ];
    return language === "html" ? [inkTheme, html(), ...emmet] : [inkTheme, css(), ...emmet];
  }, [language]);

  return (
    <CodeMirror
      value={value}
      height="100%"
      theme="none"
      extensions={extensions}
      onChange={onChange}
      className="h-full"
      aria-label={`${language.toUpperCase()} editor`}
    />
  );
}
