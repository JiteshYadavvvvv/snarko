"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GAME_CATEGORY_META } from "@/constants/game-categories";
import type { Game } from "@/types/game";

export function GameCard({ game }: { game: Game }) {
  const [expanded, setExpanded] = useState(false);
  const { label, icon: CategoryIcon } = GAME_CATEGORY_META[game.category];
  const descriptionId = `${game.slug}-description`;

  return (
    <li className="border-border bg-surface overflow-hidden rounded-md border">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
        aria-controls={descriptionId}
        aria-label={`${game.title}, ${label}${game.featured ? ", featured" : ""} — show description`}
        className="group block w-full text-left"
      >
        <div className="bg-surface-elevated relative flex aspect-[4/3] items-center justify-center overflow-hidden">
          <CategoryIcon
            aria-hidden="true"
            className="text-border-strong absolute -right-6 -bottom-6 size-32 transition-transform duration-300 group-hover:scale-110"
            strokeWidth={1}
          />
          {game.featured && (
            <Badge className="absolute top-3 left-3">Featured</Badge>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-foreground font-semibold">{game.title}</p>
            <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
              <CategoryIcon className="size-3.5" aria-hidden="true" />
              {label}
            </p>
          </div>
          <ChevronDown
            aria-hidden="true"
            className={`text-muted-foreground size-5 shrink-0 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>
      <p
        id={descriptionId}
        hidden={!expanded}
        className="text-muted-foreground border-border border-t px-4 py-3 text-sm"
      >
        {game.description}
      </p>
    </li>
  );
}
