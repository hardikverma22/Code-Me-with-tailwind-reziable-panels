import { PanelResizeHandle } from "react-resizable-panels";

export default function ResizeHandle({
  isVertical = false,
  text = "",
  isCollapsed = false,
  icon,
}) {
  return (
    <PanelResizeHandle>
      <div
        className={`flex flex-col ${
          isCollapsed ? "justify-start pt-2 px-2" : "justify-center"
        } gap-10 items-center bg-gray-950 active:bg-slate-700  ${
          isVertical ? "w-full h-8" : "h-full w-6"
        }`}
      >
        {isCollapsed ? (
          <div className="flex flex-col gap-5 justify-start items-center">
            {icon}
            <span className="rotate-90 tracking-wider text-sm">{text}</span>
          </div>
        ) : isVertical ? (
          <svg className="w-4 h-4 " viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M8,18H11V15H2V13H22V15H13V18H16L12,22L8,18M12,2L8,6H11V9H2V11H22V9H13V6H16L12,2Z"
            />
          </svg>
        ) : (
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M18,16V13H15V22H13V2H15V11H18V8L22,12L18,16M2,12L6,16V13H9V22H11V2H9V11H6V8L2,12Z"
            ></path>
          </svg>
        )}
      </div>
    </PanelResizeHandle>
  );
}
