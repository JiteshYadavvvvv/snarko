import type { ReactNode } from "react";

export function Badge({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`bg-brand-red text-brand-red-foreground inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase ${className}`.trim()}
    >
      {children}
    </span>
  );
}
