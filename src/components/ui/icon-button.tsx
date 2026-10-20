import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
}

export function IconButton({
  icon: Icon,
  label,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`text-foreground hover:bg-surface inline-flex size-10 shrink-0 items-center justify-center rounded-md transition-colors duration-150 ${className}`.trim()}
      {...props}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
