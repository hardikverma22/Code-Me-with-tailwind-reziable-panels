import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo.png";
import { AiOutlineMenu } from "./Icons";
const NavigationBar = ({ handleNew, handleTryExample }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="py-4 px-5">
      <nav>
        <div className="flex justify-between items-center">
          <div className="flex gap-4 justify-center items-center w-fit">
            <img src={logo} className="h-10 bg-white" alt="logo" />
          </div>
          <div className="md:flex hidden gap-2">
            <button
              className="px-4 py-2
                        text-white bg-slate-600
                        rounded-md
                        font-medium 
                        shadow-lg
                        hover:bg-slate-500 duration-300"
              onClick={handleNew}
            >
              New CodeME
            </button>
            <button
              className="px-4 py-2
                        text-white bg-slate-600
                        rounded-md
                        font-medium 
                        shadow-lg
                        hover:bg-slate-500 duration-300"
              onClick={handleTryExample}
            >
              Try Example
            </button>
            <ul className="hidden">
              <li>Username</li>
              <li>
                <button>Logout</button>
              </li>
            </ul>
          </div>
          <div className="flex md:hidden relative text-left">
            <button
              type="button"
              className="w-full justify-center rounded-full peer"
              aria-expanded="true"
              aria-haspopup="true"
              onClick={() => setOpen(!open)}
              ref={menuRef}
            >
              <AiOutlineMenu className="text-3xl" />
            </button>
            {open && (
              <div
                className="absolute right-0 z-10 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="menu-button"
                tabindex="-1"
              >
                <div className="py-1" role="none">
                  <a
                    onClick={handleNew}
                    className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
                    role="menuitem"
                    tabindex="-1"
                    id="menu-item-0"
                  >
                    New CodeME
                  </a>
                  <a
                    onClick={handleTryExample}
                    className="text-gray-700 block px-4 py-2 text-sm cursor-pointer"
                    role="menuitem"
                    tabindex="-1"
                    id="menu-item-1"
                  >
                    Try Example
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavigationBar;
