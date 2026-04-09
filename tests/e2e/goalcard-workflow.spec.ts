import { expect, test } from "@playwright/test";

test("creates, confirms, and reopens a GoalCard run", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("goal-input-text").fill(
    "Build an evidence-first target intelligence engine for product planning."
  );
  await page
    .getByTestId("goal-input-notes")
    .fill("Open source, small team, private deployment later.");

  await page.getByTestId("generate-goal-card").click();

  await expect(page.getByTestId("goal-card-editor")).toBeVisible();

  await page.getByTestId("goal-name-input").fill("Target Intelligence Engine MVP");
  await page.getByTestId("goal-category-input").fill("Product Strategy Tool");
  await page.getByTestId("goal-jtbd-input").fill(
    "Turn fuzzy goals into a structured GoalCard and an initial dimension backbone."
  );

  await page.getByTestId("confirm-goal-card").click();

  await expect(page.getByTestId("run-detail-panel")).toBeVisible();
  await expect(page.getByTestId("dimension-summary")).toBeVisible();
  await expect(page.getByTestId("dimension-card")).toHaveCount(6);

  await page.getByTestId("open-run-detail").click();

  await expect(page).toHaveURL(/\/runs\/.+/);
  await expect(page.getByTestId("goal-card-editor")).toBeVisible();
  await expect(page.getByTestId("goal-name-input")).toHaveValue(
    "Target Intelligence Engine MVP"
  );
  await expect(page.getByTestId("dimension-card")).toHaveCount(6);
});
