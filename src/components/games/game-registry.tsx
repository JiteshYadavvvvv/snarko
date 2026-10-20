import type { ComponentType } from "react";
import { NeonBreakerGame } from "@/components/games/neon-breaker/neon-breaker-game";
import { RidgeRunnerGame } from "@/components/games/ridge-runner/ridge-runner-game";

export const PLAYABLE_GAME_COMPONENTS: Record<string, ComponentType> = {
  "neon-breaker": NeonBreakerGame,
  "ridge-runner": RidgeRunnerGame,
};
