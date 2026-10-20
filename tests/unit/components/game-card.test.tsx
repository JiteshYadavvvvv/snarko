import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GameCard } from "@/components/home/game-card";
import type { Game } from "@/types/game";

const game: Game = {
  slug: "neon-breaker",
  title: "Neon Breaker",
  category: "arcade",
  description: "Smash through glowing blocks.",
  availability: "coming-soon",
  featured: true,
};

describe("GameCard", () => {
  it("links to the game's detail route", () => {
    render(
      <ul>
        <GameCard game={game} />
      </ul>,
    );
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/games/neon-breaker",
    );
  });

  it("surfaces the featured status in its accessible name", () => {
    render(
      <ul>
        <GameCard game={game} />
      </ul>,
    );
    expect(
      screen.getByRole("link", { name: /neon breaker.*featured/i }),
    ).toBeInTheDocument();
  });

  it("shows the coming-soon availability state", () => {
    render(
      <ul>
        <GameCard game={game} />
      </ul>,
    );
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });

  it("shows the playable availability state", () => {
    render(
      <ul>
        <GameCard
          game={{ ...game, availability: "playable", playUrl: "/play" }}
        />
      </ul>,
    );
    expect(screen.getByText("Playable now")).toBeInTheDocument();
  });
});
