import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="bg-brand-red text-brand-red-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase">
      {children}
    </span>
  );
}
