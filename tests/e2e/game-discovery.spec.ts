import { expect, test } from "@playwright/test";

test("category page lists only games in that category", async ({ page }) => {
  await page.goto("/games/category/puzzle");
  await expect(
    page.getByRole("heading", { level: 1, name: "Puzzle games" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /gridlock/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /neon breaker/i })).toHaveCount(
    0,
  );
});

test("an unknown category renders the not-found page", async ({ page }) => {
  const response = await page.goto("/games/category/strategy");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});

test("a coming-soon game detail page shows a disabled play action and related games", async ({
  page,
}) => {
  await page.goto("/games/tunnel-rush");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tunnel Rush" }),
  ).toBeVisible();
  await expect(page.getByText("Coming soon").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Not playable yet" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "You might also like" }),
  ).toBeVisible();
});

test("an unknown game slug renders the not-found page", async ({ page }) => {
  const response = await page.goto("/games/this-game-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});

test("full discovery journey: home, category, game detail, and back", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Puzzle", exact: true }).click();
  await expect(page).toHaveURL("/games/category/puzzle");
  await expect(
    page.getByRole("heading", { level: 1, name: "Puzzle games" }),
  ).toBeVisible();

  await page.getByRole("link", { name: /gridlock/i }).click();
  await expect(page).toHaveURL("/games/gridlock");
  await expect(
    page.getByRole("heading", { level: 1, name: "Gridlock" }),
  ).toBeVisible();

  await page
    .getByRole("navigation", { name: "Breadcrumb" })
    .getByRole("link", { name: "Games" })
    .click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Play now. Argue later." }),
  ).toBeVisible();
});
