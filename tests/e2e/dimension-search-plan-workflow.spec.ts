import { expect, test } from "@playwright/test";

test("creates dimensions, confirms search plan, and reopens the same run", async ({
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

  await expect(page.getByTestId("dimension-summary")).toBeVisible();
  await expect(page.getByTestId("dimension-card")).toHaveCount(6);

  await page.getByTestId("generate-dimension-draft").click();
  await expect(page.getByTestId("dimension-editor")).toBeVisible();

  await page.getByTestId("dimension-enabled-private-deployment").uncheck();
  await page
    .getByTestId("dimension-definition-private-deployment")
    .fill("Supports private rollout with clear self-hosted deployment guidance.");
  await page
    .getByTestId("dimension-evidence-private-deployment")
    .fill("deployment_mode\nsecurity\ndocs");

  await page.getByTestId("save-dimensions").click();

  await expect(page.getByTestId("run-detail-panel")).toContainText("dimensions_ready");

  await page.getByTestId("generate-search-plan").click();

  await expect(page.getByTestId("search-plan-panel")).toBeVisible();
  await expect(page.getByTestId("search-plan-group-same_goal")).toBeVisible();
  await expect(page.getByTestId("search-plan-group-dimension_leader")).toBeVisible();

  await page.getByTestId("confirm-search-plan").click();

  await expect(page.getByTestId("run-detail-panel")).toContainText("search_plan_confirmed");

  await page.getByTestId("open-run-detail").click();

  await expect(page).toHaveURL(/\/runs\/.+/);
  await expect(page.getByTestId("dimension-enabled-private-deployment")).not.toBeChecked();
  await expect(
    page.getByTestId("dimension-definition-private-deployment")
  ).toHaveValue("Supports private rollout with clear self-hosted deployment guidance.");
  await expect(page.getByTestId("search-plan-group-same_goal")).toBeVisible();
  await expect(page.getByTestId("search-plan-group-dimension_leader")).toBeVisible();
});
