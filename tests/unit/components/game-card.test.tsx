import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { GameCard } from "@/components/home/game-card";
import type { Game } from "@/types/game";

const game: Game = {
  slug: "neon-breaker",
  title: "Neon Breaker",
  category: "arcade",
  description: "Smash through glowing blocks.",
  featured: true,
};

describe("GameCard", () => {
  it("hides the description until expanded", () => {
    render(<GameCard game={game} />);
    expect(screen.getByText(game.description)).not.toBeVisible();
  });

  it("reveals the description when activated and hides it again on a second activation", async () => {
    const user = userEvent.setup();
    render(<GameCard game={game} />);

    const toggle = screen.getByRole("button");
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(game.description)).toBeVisible();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText(game.description)).not.toBeVisible();
  });

  it("surfaces the featured status in its accessible name", () => {
    render(<GameCard game={game} />);
    expect(
      screen.getByRole("button", { name: /neon breaker.*featured/i }),
    ).toBeInTheDocument();
  });
});
