import { expect, test } from "@playwright/test";

test("Neon Breaker is reachable from the homepage and marked playable", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator("#games")
    .getByRole("link", { name: /neon breaker/i })
    .click();
  await expect(page).toHaveURL("/games/neon-breaker");
  await expect(
    page.getByRole("heading", { level: 1, name: "Neon Breaker" }),
  ).toBeVisible();
  await expect(page.getByText("Playable now").first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Not playable yet" }),
  ).toHaveCount(0);
});

test("the full play journey: reveal, start, launch, score, pause, resume, restart", async ({
  page,
}) => {
  await page.goto("/games/neon-breaker");

  await page.getByRole("button", { name: "Play Neon Breaker" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Ready to play?" }),
  ).toBeVisible();
  await expect(page.getByTestId("neon-breaker-score")).toHaveText("0");
  await expect(page.getByTestId("neon-breaker-lives")).toHaveText("3");

  await page.getByRole("button", { name: "Start" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Ready to play?" }),
  ).toBeHidden();

  const gameSurface = page.getByRole("group", {
    name: "Neon Breaker game surface",
  });
  const box = await gameSurface.boundingBox();
  if (!box) {
    throw new Error("Game surface did not render a bounding box");
  }

  await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.8);
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.8);
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.8);

  await expect(async () => {
    const score = await page.getByTestId("neon-breaker-score").textContent();
    expect(score).not.toBe("0");
  }).toPass({ timeout: 10_000 });

  await page.getByRole("button", { name: "Pause" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Paused" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Continue playing" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Paused" }),
  ).toBeHidden();

  await page.getByRole("button", { name: "Restart" }).click();
  await expect(page.getByTestId("neon-breaker-score")).toHaveText("0");
  await expect(page.getByTestId("neon-breaker-lives")).toHaveText("3");
  await expect(
    page.getByRole("heading", { level: 2, name: "Paused" }),
  ).toBeHidden();
});
