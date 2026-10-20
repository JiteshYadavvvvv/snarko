import Link from "next/link";
import { AvailabilityIndicator } from "@/components/shared/availability-indicator";
import { Badge } from "@/components/ui/badge";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import { gameRoute } from "@/constants/routes";
import type { Game } from "@/types/game";

export function GameCard({ game }: { game: Game }) {
  const { label, icon: CategoryIcon } = GAME_CATEGORY_META[game.category];

  return (
    <li className="border-border bg-surface overflow-hidden rounded-md border">
      <Link
        href={gameRoute(game.slug)}
        aria-label={`${game.title}, ${label}${game.featured ? ", featured" : ""}`}
        className="group block"
      >
        <div className="bg-surface-elevated relative flex aspect-4/3 items-center justify-center overflow-hidden">
          <CategoryIcon
            aria-hidden="true"
            className="text-border-strong absolute -right-6 -bottom-6 size-32 transition-transform duration-300 group-hover:scale-110"
            strokeWidth={1}
          />
          {game.featured && (
            <Badge className="absolute top-3 left-3">Featured</Badge>
          )}
        </div>
        <div className="px-4 py-3">
          <p className="text-foreground font-semibold">{game.title}</p>
          <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
            <CategoryIcon className="size-3.5" aria-hidden="true" />
            {label}
          </p>
          <AvailabilityIndicator
            availability={game.availability}
            className="mt-2.5"
          />
        </div>
      </Link>
    </li>
  );
}
