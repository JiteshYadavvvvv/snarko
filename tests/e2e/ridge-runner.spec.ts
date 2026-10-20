import { expect, test } from "@playwright/test";

test("Ridge Runner is reachable from the homepage and marked playable", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("#games")
    .getByRole("link", { name: /ridge runner/i })
    .click();
  await expect(page).toHaveURL("/games/ridge-runner");
  await expect(
    page.getByRole("heading", { level: 1, name: "Ridge Runner" }),
  ).toBeVisible();
  await expect(page.getByText("Playable now").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Not playable yet" }),
  ).toHaveCount(0);
});

test("the full play journey: menu, world map, garage, drive, pause, resume, back to garage", async ({
  page,
}) => {
  await page.goto("/games/ridge-runner");

  await page.getByRole("button", { name: "Play Ridge Runner" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Ridge Runner" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Play" }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: "World Map" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^countryside hills/i }).click();

  await expect(
    page.getByRole("heading", { level: 2, name: "Garage" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Drive" })).toBeVisible();

  await page.getByRole("button", { name: "Drive" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Garage" }),
  ).toBeHidden();
  await expect(page.getByTestId("ridge-runner-distance")).toHaveText("0m");
  await expect(page.getByTestId("ridge-runner-fuel")).toHaveText("100%");

  const gameSurface = page.getByRole("group", {
    name: "Ridge Runner game surface",
  });
  await gameSurface.focus();

  await page.keyboard.down("ArrowUp");
  await expect(async () => {
    const distance = await page
      .getByTestId("ridge-runner-distance")
      .textContent();
    expect(distance).not.toBe("0m");
  }).toPass({ timeout: 8_000 });
  await page.keyboard.up("ArrowUp");

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Paused" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Continue driving" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Paused" }),
  ).toBeHidden();

  await page.getByRole("button", { name: "Garage" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Garage" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Drive" })).toBeVisible();
});

test("a crash, empty tank, or finish shows results with retry, garage, and world map actions", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/games/ridge-runner");
  await page.getByRole("button", { name: "Play Ridge Runner" }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: /^countryside hills/i }).click();
  await page.getByRole("button", { name: "Drive" }).click();

  const gameSurface = page.getByRole("group", {
    name: "Ridge Runner game surface",
  });
  await gameSurface.focus();

  await page.keyboard.down("ArrowUp");
  await expect(async () => {
    const status = await page.evaluate(
      () =>
        document.body.innerHTML.includes("Crashed") ||
        document.body.innerHTML.includes("Out of fuel") ||
        document.body.innerHTML.includes("Victory"),
    );
    expect(status).toBe(true);
  }).toPass({ timeout: 90_000 });
  await page.keyboard.up("ArrowUp");

  await expect(page.getByRole("button", { name: "Retry stage" })).toBeVisible();
  await expect(page.getByRole("button", { name: "World Map" })).toBeVisible();
});

test("reaching the finish line shows Victory, awards a completion bonus, and unlocks the next stage", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/games/ridge-runner");
  await page.getByRole("button", { name: "Play Ridge Runner" }).click();
  await page.getByRole("button", { name: "Play" }).click();
  await page.getByRole("button", { name: /^countryside hills/i }).click();
  await page.getByRole("button", { name: "Drive" }).click();

  const gameSurface = page.getByRole("group", {
    name: "Ridge Runner game surface",
  });
  await gameSurface.focus();

  await page.keyboard.down("ArrowUp");
  await expect(
    page.getByRole("heading", { level: 2, name: "Victory!" }),
  ).toBeVisible({ timeout: 90_000 });
  await page.keyboard.up("ArrowUp");

  await expect(page.getByText(/stage complete! \+\d+ bonus coins/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Next Stage" })).toBeVisible();
});
