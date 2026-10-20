import { expect, test } from "@playwright/test";

test("foundation page loads and renders the site name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Snarko" })).toBeVisible();
});

test("unknown routes render the not-found page", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByText("404")).toBeVisible();
});
