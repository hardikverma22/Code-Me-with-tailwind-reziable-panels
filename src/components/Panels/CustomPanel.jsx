import { useEffect, useRef, useState } from "react";
import Editor from "../Editor";
import { BsArrowDown } from "../Icons";
import PanelDropdown from "./PanelDropdown";

const CustomPanel = ({ language, value, setValue, title, icon, beautify }) => {
  const [open, setOpen] = useState(false);

  const btnRef = useRef();

  const handleBeautify = () => {
    setOpen(false);
    beautify();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (btnRef.current && !btnRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-950 ">
      <div className="hidden md:flex h-10 justify-between items-center">
        <span className="p-4 text-xl bg-[#272822] flex gap-3 justify-center items-center">
          {icon}
          {title}
        </span>
        <div className="relative h-full">
          <button
            className="h-full"
            onClick={() => setOpen(!open)}
            ref={btnRef}
          >
            <BsArrowDown
              className="text-2xl
                                  text-white bg-slate-600
                                  rounded-sm
                                  p-1
                                  hover:bg-slate-500 duration-300"
            />
          </button>
          {open ? (
            <PanelDropdown title={title} handleBeautify={handleBeautify} />
          ) : null}
        </div>
      </div>
      <div className="w-full h-full rounded-lg max-w-full max-h-[calc(100%-2.5rem)]">
        <Editor
          title={title}
          language={language}
          value={value}
          setValue={setValue}
        />
      </div>
    </div>
  );
};

export default CustomPanel;
