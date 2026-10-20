export type GameCategory = "arcade" | "puzzle" | "racing" | "action" | "casual";

export type GameInput = "keyboard" | "mouse" | "touch" | "gamepad";

interface GameBase {
  slug: string;
  title: string;
  category: GameCategory;
  description: string;
  longDescription?: string;
  featured?: boolean;
  inputs?: GameInput[];
}

export type Game =
  | (GameBase & { availability: "coming-soon" })
  | (GameBase & { availability: "playable"; playUrl: string });

export type GameAvailability = Game["availability"];
