"use client";

import { useState, type ComponentType } from "react";
import { GameArtwork } from "@/components/games/game-artwork";
import { Button } from "@/components/ui/button";
import type { GameCategory } from "@/types/game";

export function GamePlayer({
  title,
  slug,
  category,
  GameComponent,
}: {
  title: string;
  slug: string;
  category: GameCategory;
  GameComponent: ComponentType;
}) {
  const [started, setStarted] = useState(false);

  if (started) {
    return <GameComponent />;
  }

  return (
    <div className="border-border relative overflow-hidden rounded-lg border">
      <GameArtwork slug={slug} category={category} className="aspect-video" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Button onClick={() => setStarted(true)}>Play {title}</Button>
      </div>
    </div>
  );
}
