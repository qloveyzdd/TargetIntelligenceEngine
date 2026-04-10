import { expect, test } from "@playwright/test";

test("shows the visual surface, supports click explanation, and survives reopen", async ({
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
  await expect(page.getByTestId("visual-intelligence-surface")).toBeVisible();
  await expect(page.getByTestId("radar-chart")).toBeVisible();
  await expect(page.getByTestId("relationship-graph")).toBeVisible();

  const radarSeriesButtons = page.getByTestId("radar-series-button");
  await expect(radarSeriesButtons).toHaveCount(4);

  const firstCandidateLabel = (await radarSeriesButtons.nth(1).textContent())?.trim() ?? "";

  await radarSeriesButtons.nth(1).click();
  await expect(page.getByTestId("visual-explanation-panel")).toContainText(firstCandidateLabel);

  const candidateToggles = page.getByTestId("radar-candidate-toggle");
  await candidateToggles.first().uncheck();
  await expect(radarSeriesButtons).toHaveCount(3);
  await candidateToggles.first().check();
  await expect(radarSeriesButtons).toHaveCount(4);

  await page
    .locator('[data-testid="relationship-graph"]')
    .getByText(firstCandidateLabel)
    .first()
    .click();
  await expect(page.getByTestId("visual-explanation-panel")).toContainText(firstCandidateLabel);

  await page.getByTestId("graph-edge-button").first().click();
  await expect(page.getByTestId("visual-explanation-panel")).toContainText(
    "Relationship explanation"
  );

  const gapNode = page
    .locator('[data-testid="relationship-graph"]')
    .getByText(/ gap$/)
    .first();
  await gapNode.click();
  await expect(page.getByTestId("visual-explanation-panel")).toContainText("Gap explanation");

  await page.getByTestId("open-run-detail").click();

  await expect(page).toHaveURL(/\/runs\/.+/);
  await expect(page.getByTestId("visual-intelligence-surface")).toBeVisible();
  await expect(page.getByTestId("radar-chart")).toBeVisible();
  await expect(page.getByTestId("relationship-graph")).toBeVisible();
  await expect(radarSeriesButtons).toHaveCount(4);

  await radarSeriesButtons.nth(1).click();
  await expect(page.getByTestId("visual-explanation-panel")).toContainText(firstCandidateLabel);
});
