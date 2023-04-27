import CodeMirror from "@uiw/react-codemirror";
import { okaidia } from "@uiw/codemirror-theme-okaidia";
import { useCallback } from "react";

const Editor = ({ title, language, value, setValue }) => {
  // console.log(resize);
  const onChange = useCallback((value, viewUpdate) => {
    setValue(value);
  }, []);

  return (
    <CodeMirror
      height="100%"
      width="100%"
      value={value}
      theme={okaidia}
      extensions={[language]}
      onChange={onChange}
      maxWidth="600px"
      className="codemirror-custom-editor"
      placeholder={`Start typing the ${title} code`}
      basicSetup={{
        lineNumbers: true,
        autocompletion: true,
        mode: language,
        foldGutter: true,
        highlightActiveLine: true,
        highlightSelectionMatches: true,
        bracketMatching: true,
      }}
    />
  );
};

export default Editor;
