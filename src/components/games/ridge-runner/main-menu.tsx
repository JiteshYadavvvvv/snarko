import { Coins, Gauge, Trophy } from "lucide-react";
import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import type { SaveData } from "@/components/games/ridge-runner/engine/types";
import { Button } from "@/components/ui/button";

function bestOverallDistance(save: SaveData): number {
  const values = Object.values(save.stageBestDistance);
  return values.length > 0 ? Math.max(...values) : 0;
}

export function MainMenu({
  save,
  onPlay,
}: {
  save: SaveData;
  onPlay: () => void;
}) {
  const unlockedAchievements = save.unlockedAchievementIds.length;

  return (
    <div className="flex flex-col items-center gap-5 p-2 text-center sm:p-4">
      <div>
        <h2 className="text-foreground text-2xl font-bold">Ridge Runner</h2>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          A physics hill-driving run across three stages. Gas to climb, brake to
          settle, lean in the air to land clean.
        </p>
      </div>

      <div className="text-foreground flex flex-wrap items-center justify-center gap-5 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Coins className="text-brand-red size-4" aria-hidden="true" />
          {save.coins} coins
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gauge className="text-brand-red size-4" aria-hidden="true" />
          Best: {bestOverallDistance(save)}m
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="text-brand-red size-4" aria-hidden="true" />
          {unlockedAchievements}/{ACHIEVEMENTS.length} achievements
        </span>
      </div>

      <Button onClick={onPlay}>Play</Button>
    </div>
  );
}
