import { Lock, Trophy } from "lucide-react";
import { ACHIEVEMENTS } from "@/components/games/ridge-runner/engine/achievements";
import type { SaveData } from "@/components/games/ridge-runner/engine/types";
import { Button } from "@/components/ui/button";

export function AchievementsScreen({
  save,
  onBack,
}: {
  save: SaveData;
  onBack: () => void;
}) {
  const unlockedCount = save.unlockedAchievementIds.length;

  return (
    <div className="flex flex-col gap-4 p-2 text-center sm:p-4">
      <div>
        <h2 className="text-foreground text-2xl font-bold">Achievements</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {unlockedCount}/{ACHIEVEMENTS.length} unlocked
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-left">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = save.unlockedAchievementIds.includes(
            achievement.id,
          );
          return (
            <li
              key={achievement.id}
              className={`bg-surface-elevated flex items-center gap-3 rounded-lg border p-3 ${
                unlocked ? "border-brand-red" : "border-border opacity-70"
              }`}
            >
              {unlocked ? (
                <Trophy
                  className="text-brand-red size-5 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Lock
                  className="text-muted-foreground size-5 shrink-0"
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="text-foreground text-sm font-semibold">
                  {achievement.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {achievement.description}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <Button variant="ghost" onClick={onBack} className="mx-auto">
        Back to menu
      </Button>
    </div>
  );
}
