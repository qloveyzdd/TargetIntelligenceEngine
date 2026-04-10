import { expect, test } from "@playwright/test";

test("generates stage goals, previews handoff, and survives reopen", async ({
  page
}) => {
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
  await page.getByTestId("save-dimensions").click();
  await page.getByTestId("generate-search-plan").click();
  await page.getByTestId("confirm-search-plan").click();
  await page.getByTestId("generate-candidates").click();
  await page.getByTestId("generate-evidence").click();
  await page.getByTestId("generate-scoring").click();

  await expect(page.getByTestId("stage-goals-empty-state")).toBeVisible();

  await page.getByTestId("generate-stage-goals").click();
  await expect(page.getByTestId("stage-goal-card")).toHaveCount(3);

  await page.getByTestId("preview-stage-goal-handoff").click();
  await expect(page.getByTestId("stage-goal-handoff-preview")).toContainText("goalSummary");
  await expect(page.getByTestId("stage-goal-handoff-preview")).toContainText("stageGoals");

  await page.getByTestId("copy-stage-goal-handoff").click();
  await expect(page.getByTestId("stage-goal-copy-status")).toBeVisible();

  await page.getByTestId("open-run-detail").click();

  await expect(page).toHaveURL(/\/runs\/.+/);
  await expect(page.getByTestId("stage-goal-card")).toHaveCount(3);

  await page.getByTestId("preview-stage-goal-handoff").click();
  await expect(page.getByTestId("stage-goal-handoff-preview")).toContainText(
    "validation"
  );
});
