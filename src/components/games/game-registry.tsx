import type { ComponentType } from "react";
import { NeonBreakerGame } from "@/components/games/neon-breaker/neon-breaker-game";

export const PLAYABLE_GAME_COMPONENTS: Record<string, ComponentType> = {
  "neon-breaker": NeonBreakerGame,
};
