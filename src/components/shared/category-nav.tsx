import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import { categoryRoute } from "@/constants/routes";
import type { GameCategory } from "@/types/game";

function CategoryNavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon?: LucideIcon;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
        isActive
          ? "bg-brand-red text-brand-red-foreground border-brand-red"
          : "border-border-strong text-foreground hover:bg-surface-elevated"
      }`}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {label}
    </Link>
  );
}

export function CategoryNav({
  categories,
  active,
  className = "",
}: {
  categories: GameCategory[];
  active: GameCategory | "all";
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      <CategoryNavLink href="/" label="All" isActive={active === "all"} />
      {categories.map((category) => {
        const meta = GAME_CATEGORY_META[category];
        return (
          <CategoryNavLink
            key={category}
            href={categoryRoute(category)}
            label={meta.label}
            icon={meta.icon}
            isActive={active === category}
          />
        );
      })}
    </div>
  );
}
