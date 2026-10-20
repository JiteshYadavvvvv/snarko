import { expect, test } from "@playwright/test";

test("homepage renders the hero and the game grid", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Browser games, no waiting around.",
    }),
  ).toBeVisible();
  await expect(page.locator("#games li")).toHaveCount(8);
});

test("search filters the grid and shows an empty state with no matches", async ({
  page,
}) => {
  await page.goto("/");
  const search = page.getByLabel("Search games").first();

  await search.fill("neon");
  await expect(page.locator("#games li")).toHaveCount(1);

  await search.fill("this-will-never-match-anything");
  await expect(page.getByText("No games match your search.")).toBeVisible();

  await page.getByRole("button", { name: "Reset search" }).click();
  await expect(page.locator("#games li")).toHaveCount(8);
});

test("category navigation links point at real category routes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: "Racing", exact: true }),
  ).toHaveAttribute("href", "/games/category/racing");
});

test("a game card links to its detail route", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /neon breaker/i }),
  ).toHaveAttribute("href", "/games/neon-breaker");
});

test("mobile menu opens, exposes navigation, and closes with Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const toggle = page.getByRole("button", { name: "Open menu" });
  await toggle.click();
  await expect(page.locator("#mobile-nav")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toBeHidden();
});

test("unknown routes render the not-found page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});
