import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand-red px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-red-foreground">
      {children}
    </span>
  );
}
