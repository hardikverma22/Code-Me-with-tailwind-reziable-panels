import { langs } from "@uiw/codemirror-extensions-langs";
import Beautify from "js-beautify";
import { useEffect, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";

import { AiFillHtml5, FaCss3Alt, IoLogoJavascript } from "../Icons";
import CustomPanel from "./CustomPanel";
import ResizeHandle from "./ResizeHandle";
import Tabs from "../Tabs";
import Output from "../Output";

const Panels = (props) => {
  const { html, setHtml, css, setCss, javascript, setJavascript, srcDoc } =
    props;

  const [isHtmlCollapsed, setIsHTMlCollapsed] = useState(false);
  const [isCSSCollapsed, setIsCSSCollapsed] = useState(false);
  const [isJSCollapsed, setIsJSCollapsed] = useState(false);

  const beautifyHTML = () => {
    const htmlBeautify = Beautify.html;
    setHtml((html) => htmlBeautify(html, { indent_size: 2 }));
  };

  const beautifyCSS = () => {
    let cssBeautify = Beautify.css;
    setCss((css) => cssBeautify(css, { indent_size: 2 }));
  };

  const beautifyJS = () => {
    let jsBeautify = Beautify.js;
    setJavascript((js) =>
      jsBeautify(js, {
        indent_size: "2",
        indent_char: " ",
        max_preserve_newlines: "1",
        preserve_newlines: true,
        keep_array_indentation: true,
        break_chained_methods: true,
        indent_scripts: "separate",
        brace_style: "expand",
        space_before_conditional: true,
        unescape_strings: false,
        jslint_happy: false,
        end_with_newline: true,
        wrap_line_length: "160",
        indent_inner_html: false,
        comma_first: false,
        e4x: true,
        indent_empty_lines: false,
      })
    );
  };

  return (
    <>
      <div className="md:block hidden w-full h-full p-2">
        <div className="w-full- h-full flex flex-col gap-4">
          <PanelGroup direction="vertical">
            <Panel collapsible={false} defaultSize={30} order={1}>
              <PanelGroup direction="horizontal">
                <Panel
                  collapsible={true}
                  defaultSize={33}
                  order={1}
                  onCollapse={(b) => setIsHTMlCollapsed(b)}
                >
                  <CustomPanel
                    title="HTML"
                    language={langs.html()}
                    value={html}
                    setValue={setHtml}
                    icon={
                      <AiFillHtml5 className="text-xl bg-red-400 text-black rounded-sm" />
                    }
                    beautify={beautifyHTML}
                  />
                </Panel>
                <ResizeHandle
                  isCollapsed={isCSSCollapsed || isHtmlCollapsed}
                  text={isHtmlCollapsed ? "HTML" : "CSS"}
                  icon={
                    isHtmlCollapsed ? (
                      <AiFillHtml5 className="text-md bg-red-400 text-black rounded-sm" />
                    ) : (
                      <FaCss3Alt className="text-md bg-blue-500 text-black rounded-sm" />
                    )
                  }
                />

                <Panel
                  collapsible={true}
                  order={2}
                  onCollapse={(b) => setIsCSSCollapsed(b)}
                >
                  <CustomPanel
                    title="CSS"
                    language={langs.css()}
                    value={css}
                    setValue={setCss}
                    icon={
                      <FaCss3Alt className="text-xl bg-blue-500 text-black rounded-sm" />
                    }
                    beautify={beautifyCSS}
                  />
                </Panel>
                <ResizeHandle
                  isCollapsed={isCSSCollapsed || isJSCollapsed}
                  text={isJSCollapsed ? "JAVASCRIPT" : "CSS"}
                  icon={
                    isJSCollapsed ? (
                      <IoLogoJavascript className="text-md bg-yellow-500 text-black rounded-sm" />
                    ) : (
                      <FaCss3Alt className="text-md bg-blue-500 text-black rounded-sm" />
                    )
                  }
                />
                <Panel
                  collapsible={true}
                  defaultSize={33}
                  order={3}
                  onCollapse={(b) => setIsJSCollapsed(b)}
                >
                  <CustomPanel
                    title="JAVASCRIPT"
                    language={langs.javascript()}
                    value={javascript}
                    setValue={setJavascript}
                    icon={
                      <IoLogoJavascript className="text-xl bg-yellow-500 text-black rounded-sm" />
                    }
                    beautify={beautifyJS}
                  />
                </Panel>
              </PanelGroup>
            </Panel>
            <Panel collapsible={false} defaultSize={30} order={1}>
              <ResizeHandle isVertical={true} />
              <Output srcDoc={srcDoc} />
            </Panel>
          </PanelGroup>
        </div>
      </div>
      <div className="block md:hidden px-5">
        <Tabs
          html={html}
          setHtml={setHtml}
          beautifyHTML={beautifyHTML}
          css={css}
          setCss={setCss}
          beautifyCSS={beautifyCSS}
          javascript={javascript}
          setJavascript={setJavascript}
          beautifyJS={beautifyJS}
          srcDoc={srcDoc}
        />
      </div>
    </>
  );
};

export default Panels;
