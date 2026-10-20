import type { ReactNode } from "react";

/** The output window: a floating, softly lit surface. */
export default function ProofSheet({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`lift relative overflow-hidden rounded-2xl bg-white ${className}`}>{children}</div>;
}
