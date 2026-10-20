import { Coins, Gauge, Trophy, Wrench } from "lucide-react";
import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import type { SaveData } from "@/components/games/ridge-runner/engine/types";
import { Button } from "@/components/ui/button";

function bestOverallDistance(save: SaveData): number {
  const values = Object.values(save.stageBestDistance);
  return values.length > 0 ? Math.max(...values) : 0;
}

function MenuBackdrop() {
  return (
    <svg
      viewBox="0 0 400 140"
      preserveAspectRatio="none"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <defs>
        <linearGradient id="rr-menu-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7c59f" />
          <stop offset="100%" stopColor="#cfeefc" />
        </linearGradient>
      </defs>
      <rect width="400" height="140" fill="url(#rr-menu-sky)" />
      <path
        d="M0 90 L40 55 L80 80 L130 40 L180 85 L230 50 L280 88 L330 60 L400 95 L400 140 L0 140 Z"
        fill="#9fb8c4"
        opacity="0.55"
      />
      <path
        d="M0 115 L50 90 L100 110 L160 75 L220 112 L280 85 L340 115 L400 100 L400 140 L0 140 Z"
        fill="#3f7d4a"
        opacity="0.8"
      />
    </svg>
  );
}

export function MainMenu({
  save,
  onPlay,
  onOpenGarage,
  onOpenAchievements,
}: {
  save: SaveData;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenAchievements: () => void;
}) {
  const unlockedAchievements = save.unlockedAchievementIds.length;

  return (
    <div className="flex flex-col items-center gap-5 p-2 text-center sm:p-4">
      <div className="border-border relative w-full overflow-hidden rounded-xl border">
        <MenuBackdrop />
        <div className="relative flex flex-col items-center gap-2 px-4 py-8 sm:py-10">
          <h2 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] sm:text-4xl">
            Ridge Runner
          </h2>
          <p className="max-w-sm text-sm font-medium text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]">
            A physics hill-driving run across three stages. Gas to climb,
            brake to settle, lean in the air to land clean.
          </p>
        </div>
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

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={onPlay}>Play</Button>
        <Button variant="secondary" onClick={onOpenGarage}>
          <Wrench className="size-4" aria-hidden="true" />
          Garage
        </Button>
        <Button variant="ghost" onClick={onOpenAchievements}>
          <Trophy className="size-4" aria-hidden="true" />
          Achievements
        </Button>
      </div>
    </div>
  );
}
