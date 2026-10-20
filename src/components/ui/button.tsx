import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-red text-brand-red-foreground hover:opacity-90",
  secondary:
    "border border-border-strong text-foreground hover:bg-surface-elevated",
  ghost: "text-foreground hover:bg-surface",
};

interface SharedProps {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}

type ButtonLinkProps = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

type ButtonElementProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

type ButtonProps = ButtonLinkProps | ButtonElementProps;

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const classes = [baseClasses, variantClasses[variant], className]
    .filter(Boolean)
    .join(" ");

  if (props.href !== undefined) {
    const { href, ...linkProps } = props as ButtonLinkProps;
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      {...(props as ButtonElementProps)}
    >
      {children}
    </button>
  );
}
