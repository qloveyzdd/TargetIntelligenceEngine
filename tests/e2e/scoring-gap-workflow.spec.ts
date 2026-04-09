import { expect, test } from "@playwright/test";

test("generates scoring and gap priorities, then reopens the same run", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("goal-input-text").fill(
    "Build an evidence-first target intelligence engine for product planning."
  );
  await page
    .getByTestId("goal-input-notes")
    .fill("Open source, small team, private deployment later.");

  await page.getByTestId("generate-goal-card").click();
  await expect(page.getByTestId("goal-card-editor")).toBeVisible();

  await page.getByTestId("confirm-goal-card").click();
  await page.getByTestId("generate-dimension-draft").click();
  await expect(page.getByTestId("dimension-editor")).toBeVisible();

  await page.getByTestId("save-dimensions").click();
  await page.getByTestId("generate-search-plan").click();
  await expect(page.getByTestId("search-plan-panel")).toBeVisible();

  await page.getByTestId("confirm-search-plan").click();
  await page.getByTestId("generate-candidates").click();
  await expect(page.getByTestId("candidate-card").first()).toBeVisible();

  await page.getByTestId("generate-evidence").click();
  await expect(page.getByTestId("evidence-record").first()).toBeVisible();

  await page.getByTestId("generate-scoring").click();
  await expect(page.getByTestId("scoring-panel")).toBeVisible();
  await expect(page.getByTestId("candidate-scorecard").first()).toBeVisible();
  await expect(page.getByTestId("overall-score").first()).not.toHaveText("Unknown");
  await expect(page.getByTestId("coverage-value").first()).toBeVisible();
  await expect(page.getByTestId("unknown-count-value").first()).toBeVisible();
  await expect(page.getByTestId("gap-details").first()).toBeVisible();

  await page.getByTestId("dimension-scorecard-toggle").first().click();
  await expect(page.getByTestId("score-contribution").first()).toBeVisible();

  await page.getByTestId("gap-toggle").first().click();
  await expect(page.getByText(/Benchmark evidence IDs:/).first()).toBeVisible();

  await page.getByTestId("open-run-detail").click();

  await expect(page).toHaveURL(/\/runs\/.+/);
  await expect(page.getByTestId("scoring-panel")).toBeVisible();
  await expect(page.getByTestId("overall-score").first()).not.toHaveText("Unknown");
  await expect(page.getByTestId("gap-details").first()).toBeVisible();
});
