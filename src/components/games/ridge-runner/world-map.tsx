import { CheckCircle2, Lock } from "lucide-react";
import {
  STAGES,
  getStageDefinition,
  isStageUnlocked,
} from "@/components/games/ridge-runner/engine/stages";
import type {
  SaveData,
  StagePalette,
} from "@/components/games/ridge-runner/engine/types";
import { Button } from "@/components/ui/button";

function StageArtwork({ palette }: { palette: StagePalette }) {
  return (
    <svg
      viewBox="0 0 80 80"
      aria-hidden="true"
      className="size-14 shrink-0 rounded-md"
    >
      <defs>
        <linearGradient
          id={`sky-${palette.skyTop}-${palette.skyBottom}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
      </defs>
      <rect
        width="80"
        height="80"
        fill={`url(#sky-${palette.skyTop}-${palette.skyBottom})`}
      />
      <path
        d="M0 52 L16 34 L30 48 L48 24 L62 44 L80 36 L80 80 L0 80 Z"
        fill={palette.mountainFill}
        opacity="0.85"
      />
      <path
        d="M0 64 L20 50 L38 62 L56 46 L80 58 L80 80 L0 80 Z"
        fill={palette.groundFill}
      />
    </svg>
  );
}

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
          Pick a stage. Reach the finish line to complete it and unlock the
          next.
        </p>
      </div>

      <ul className="relative flex flex-col gap-3">
        <span
          aria-hidden="true"
          className="border-border absolute top-7 bottom-7 left-6.75 border-l-2 border-dashed"
        />
        {STAGES.map((stage) => {
          const unlocked = isStageUnlocked(stage, save.stageBestDistance);
          const completed = save.completedStageIds?.includes(stage.id);
          const best = save.stageBestDistance[stage.id] ?? 0;
          const requirement =
            stage.unlock.type === "stage-distance"
              ? `Reach ${stage.unlock.distance}m on ${getStageDefinition(stage.unlock.stageId).name}`
              : null;

          return (
            <li key={stage.id} className="relative">
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => unlocked && onSelectStage(stage.id)}
                className="border-border bg-surface-elevated flex w-full items-center gap-4 rounded-lg border p-3 text-left disabled:opacity-50"
              >
                <StageArtwork palette={stage.palette} />
                <span className="flex-1">
                  <span className="text-foreground flex items-center gap-1.5 font-semibold">
                    {!unlocked && (
                      <Lock className="size-3.5" aria-hidden="true" />
                    )}
                    {stage.name}
                    {completed && (
                      <CheckCircle2
                        className="size-3.5 text-amber-500"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span className="text-muted-foreground block text-xs">
                    {unlocked ? stage.description : requirement}
                  </span>
                </span>
                {unlocked && (
                  <span className="text-muted-foreground flex shrink-0 flex-col items-end text-xs">
                    <span>Best: {best}m</span>
                    <span>Finish: {stage.finishDistance}m</span>
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
