import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import GameDetailPage, { generateMetadata } from "@/app/games/[slug]/page";

describe("GameDetailPage", () => {
  it("renders a playable game's embedded Play trigger instead of a disabled action", async () => {
    const jsx = await GameDetailPage({
      params: Promise.resolve({ slug: "neon-breaker" }),
    });
    render(jsx);

    expect(
      screen.getByRole("heading", { level: 1, name: "Neon Breaker" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/classic paddle-and-block/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Play Neon Breaker" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Not playable yet" }),
    ).not.toBeInTheDocument();
  });

  it("renders a disabled coming-soon action for an unplayable game", async () => {
    const jsx = await GameDetailPage({
      params: Promise.resolve({ slug: "tunnel-rush" }),
    });
    render(jsx);

    expect(
      screen.getByRole("heading", { level: 1, name: "Tunnel Rush" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Not playable yet" }),
    ).toBeDisabled();
  });

  it("includes related games from the same category", async () => {
    const jsx = await GameDetailPage({
      params: Promise.resolve({ slug: "neon-breaker" }),
    });
    render(jsx);

    expect(
      screen.getByRole("heading", { name: "You might also like" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /tunnel rush/i })).toHaveAttribute(
      "href",
      "/games/tunnel-rush",
    );
  });

  it("calls notFound for an unknown slug", async () => {
    await expect(
      GameDetailPage({ params: Promise.resolve({ slug: "does-not-exist" }) }),
    ).rejects.toThrow();
  });
});

describe("generateMetadata for a game detail route", () => {
  it("returns the game's own title, description, and canonical path", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "neon-breaker" }),
    });
    expect(metadata.title).toBe("Neon Breaker");
    expect(metadata.alternates?.canonical).toBe("/games/neon-breaker");
  });

  it("returns empty metadata for an unknown slug", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "does-not-exist" }),
    });
    expect(metadata).toEqual({});
  });
});
