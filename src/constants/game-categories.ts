import { Dice5, Gamepad2, Gauge, Puzzle, Swords } from "lucide-react";
import type { GameCategory } from "@/types/game";

export const GAME_CATEGORY_META: Record<
  GameCategory,
  { label: string; description: string; icon: typeof Gamepad2 }
> = {
  arcade: {
    label: "Arcade",
    description: "Quick-reflex, high-score chasers built for one more try.",
    icon: Gamepad2,
  },
  puzzle: {
    label: "Puzzle",
    description: "Logic and spatial puzzles that reward a clear head.",
    icon: Puzzle,
  },
  racing: {
    label: "Racing",
    description: "Speed, drift, and tight-circuit driving games.",
    icon: Gauge,
  },
  action: {
    label: "Action",
    description: "Combat and side-scrolling action, brawler-style.",
    icon: Swords,
  },
  casual: {
    label: "Casual",
    description: "Low-pressure, pick-up-and-play games for a quick break.",
    icon: Dice5,
  },
};

export const GAME_CATEGORIES = Object.keys(
  GAME_CATEGORY_META,
) as GameCategory[];

export function isGameCategory(value: string): value is GameCategory {
  return (GAME_CATEGORIES as string[]).includes(value);
}
