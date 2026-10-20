import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CategoryPage, {
  generateMetadata,
} from "@/app/games/category/[category]/page";

describe("CategoryPage", () => {
  it("lists only games in the requested category", async () => {
    const jsx = await CategoryPage({
      params: Promise.resolve({ category: "puzzle" }),
    });
    render(jsx);

    expect(
      screen.getByRole("heading", { level: 1, name: "Puzzle games" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gridlock/i })).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /neon breaker/i }),
    ).not.toBeInTheDocument();
  });

  it("calls notFound for an unsupported category slug", async () => {
    await expect(
      CategoryPage({ params: Promise.resolve({ category: "strategy" }) }),
    ).rejects.toThrow();
  });
});

describe("generateMetadata for a category route", () => {
  it("returns the category's own title, description, and canonical path", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: "racing" }),
    });
    expect(metadata.title).toBe("Racing games");
    expect(metadata.alternates?.canonical).toBe("/games/category/racing");
  });

  it("returns empty metadata for an unsupported category slug", async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ category: "strategy" }),
    });
    expect(metadata).toEqual({});
  });
});
