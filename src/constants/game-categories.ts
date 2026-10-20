import { Dice5, Gamepad2, Gauge, Puzzle, Swords } from "lucide-react";
import type { GameCategory } from "@/types/game";

export const GAME_CATEGORY_META: Record<
  GameCategory,
  { label: string; icon: typeof Gamepad2 }
> = {
  arcade: { label: "Arcade", icon: Gamepad2 },
  puzzle: { label: "Puzzle", icon: Puzzle },
  racing: { label: "Racing", icon: Gauge },
  action: { label: "Action", icon: Swords },
  casual: { label: "Casual", icon: Dice5 },
};
