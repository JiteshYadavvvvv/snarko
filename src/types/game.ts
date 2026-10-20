export type GameCategory = "arcade" | "puzzle" | "racing" | "action" | "casual";

export type GameInput = "keyboard" | "mouse" | "touch" | "gamepad";

export interface Game {
  slug: string;
  title: string;
  category: GameCategory;
  description: string;
  featured?: boolean;
  inputs?: GameInput[];
  route?: string;
}
