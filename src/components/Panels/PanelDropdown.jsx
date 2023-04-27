const PanelDropdown = ({ handleBeautify, title }) => {
  return (
    <div
      className="absolute right-0 z-10 md:mt-2 mt-36 w-56 origin-top-right rounded-md bg-gray-800 text-white shadow-lg"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      tabIndex="-1"
    >
      <div className="py-1" role="none">
        <button
          className="block px-4 py-2 text-sm"
          role="menuitem"
          tabIndex="-1"
          onClick={handleBeautify}
        >
          Format {title}
        </button>
        <button
          className="md:block hidden px-4 py-2 text-sm"
          role="menuitem"
          tabIndex="-1"
        >
          Minimize {title}
        </button>
      </div>
    </div>
  );
};

export default PanelDropdown;
