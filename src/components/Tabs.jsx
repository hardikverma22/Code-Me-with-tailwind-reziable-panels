import { useEffect, useRef, useState } from "react";
import { langs } from "@uiw/codemirror-extensions-langs";
import CustomPanel from "./Panels/CustomPanel";
import { AiFillHtml5, BsArrowDown } from "../components/Icons";
import PanelDropdown from "./Panels/PanelDropdown";
import Output from "./Output";
const Tabs = (props) => {
  const {
    html,
    setHtml,
    beautifyHTML,
    css,
    setCss,
    beautifyCSS,
    javascript,
    setJavascript,
    beautifyJS,
    srcDoc,
  } = props;
  const [currentTab, setCurrentTab] = useState(0);

  const [open, setOpen] = useState(false);

  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getCurrentTitle = () => {
    return currentTab === 0 ? "HTML" : currentTab === 1 ? "CSS" : "JAVASCRIPT";
  };

  const getCurrentBeautifyFn = () => {
    return currentTab === 0
      ? beautifyHTML
      : currentTab === 1
      ? beautifyCSS
      : beautifyJS;
  };

  return (
    <div className="flex flex-col gap-3 h-screen">
      <div className="relative flex justify-between items-center">
        <ul className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          <li className="mr-2">
            <button
              aria-current="page"
              className={`inline-block ${
                currentTab === 0
                  ? "bg-gray-300 text-pink-600"
                  : "bg-gray-700 text-white"
              }
                rounded-t-lg py-4 px-4 text-sm font-bold text-center`}
              onClick={() => setCurrentTab(0)}
            >
              HTML
            </button>
          </li>
          <li className="mr-2">
            <button
              aria-current="page"
              className={`inline-block ${
                currentTab === 1
                  ? "bg-gray-300 text-blue-600"
                  : "bg-gray-700 text-white"
              }
                rounded-t-lg py-4 px-4 text-sm font-bold text-center`}
              onClick={() => setCurrentTab(1)}
            >
              CSS
            </button>
          </li>
          <li className="mr-2">
            <button
              aria-current="page"
              className={`inline-block ${
                currentTab === 2
                  ? "bg-gray-300 text-yellow-600"
                  : "bg-gray-700 text-white"
              }
                rounded-t-lg py-4 px-4 text-sm font-bold text-center`}
              onClick={() => setCurrentTab(2)}
            >
              JAVASCRIPT
            </button>
          </li>
        </ul>
        <button
          className="h-full flex justify-center items-center"
          onClick={() => setOpen(!open)}
          ref={ref}
        >
          <BsArrowDown
            className="text-3xl
                      text-white bg-slate-600
                        rounded-sm
                        p-1
                      hover:bg-slate-500 duration-300"
          />
        </button>
        {open ? (
          <PanelDropdown
            title={getCurrentTitle()}
            handleBeautify={getCurrentBeautifyFn}
          />
        ) : null}
      </div>

      <div className="flex flex-col w-full h-full">
        <div className="w-full h-[50%] flex-grow">
          {currentTab === 0 ? (
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
          ) : currentTab === 1 ? (
            <CustomPanel
              title="CSS"
              language={langs.css()}
              value={css}
              setValue={setCss}
              icon={
                <AiFillHtml5 className="text-xl bg-red-400 text-black rounded-sm" />
              }
              beautify={beautifyCSS}
            />
          ) : (
            <CustomPanel
              title="JAVASCRIPT"
              language={langs.javascript()}
              value={javascript}
              setValue={setJavascript}
              icon={
                <AiFillHtml5 className="text-xl bg-red-400 text-black rounded-sm" />
              }
              beautify={beautifyJS}
            />
          )}
        </div>
        <div className="h-[50%]">
          <Output srcDoc={srcDoc} />
        </div>
      </div>
    </div>
  );
};

export default Tabs;
