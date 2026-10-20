import { Lock } from "lucide-react";
import {
  STAGES,
  getStageDefinition,
  isStageUnlocked,
} from "@/components/games/ridge-runner/engine/stages";
import type { SaveData } from "@/components/games/ridge-runner/engine/types";
import { Button } from "@/components/ui/button";

export function WorldMap({
  save,
  onSelectStage,
  onBack,
}: {
  save: SaveData;
  onSelectStage: (stageId: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4">
      <div className="text-center">
        <h2 className="text-foreground text-2xl font-bold">World Map</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a stage. Later stages unlock by distance on the one before.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {STAGES.map((stage) => {
          const unlocked = isStageUnlocked(stage, save.stageBestDistance);
          const best = save.stageBestDistance[stage.id] ?? 0;
          const requirement =
            stage.unlock.type === "stage-distance"
              ? `Reach ${stage.unlock.distance}m on ${getStageDefinition(stage.unlock.stageId).name}`
              : null;

          return (
            <li key={stage.id}>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && onSelectStage(stage.id)}
                className="border-border bg-surface-elevated flex w-full items-center gap-4 rounded-lg border p-3 text-left disabled:opacity-50"
              >
                <span
                  aria-hidden="true"
                  className="size-12 shrink-0 rounded-md"
                  style={{
                    background: `linear-gradient(to bottom, ${stage.palette.skyTop}, ${stage.palette.groundFill})`,
                  }}
                />
                <span className="flex-1">
                  <span className="text-foreground flex items-center gap-1.5 font-semibold">
                    {!unlocked && (
                      <Lock className="size-3.5" aria-hidden="true" />
                    )}
                    {stage.name}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {unlocked ? stage.description : requirement}
                  </span>
                </span>
                {unlocked && (
                  <span className="text-muted-foreground shrink-0 text-xs">
                    Best: {best}m
                  </span>
                )}
              </button>
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
