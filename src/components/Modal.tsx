import { useEffect, useEffectEvent, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean };

/** A centred dialog on the editor's dark surface. Esc and a click on the backdrop close it. */
export default function Modal({ title, onClose, children, footer, wide }: Props) {
  const id = useId();
  const box = useRef<HTMLDivElement>(null);

  // Callers pass an inline function; an effect event keeps focus from being reset on every render.
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("keydown", esc); previous?.focus?.(); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bench/80 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby={id}
        tabIndex={-1}
        data-lenis-prevent=""
        className={`flex max-h-[85dvh] w-full flex-col rounded-2xl bg-bed-raised text-paper shadow-2xl ring-1 ring-rule outline-none ${wide ? "max-w-4xl" : "max-w-xl"}`}
      >
        <header className="flex shrink-0 items-center justify-between px-5 pb-2 pt-4">
          <h2 id={id} className="text-base font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1 text-fade transition-colors hover:text-paper"><X size={18} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto px-5 pb-4">{children}</div>
        {footer && <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-rule px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
