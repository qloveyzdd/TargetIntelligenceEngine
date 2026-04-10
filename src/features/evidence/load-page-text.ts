function stripHtmlTags(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizePageText(value: string) {
  return stripHtmlTags(value).slice(0, 20_000);
}

export function shouldUseBrowserFallback(value: string) {
  return value.trim().length < 280;
}

async function loadWithPlaywright(url: string) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(url, {
      timeout: 15_000,
      waitUntil: "domcontentloaded"
    });
    const bodyText = await page.locator("body").innerText().catch(() => "");
    return normalizePageText(bodyText);
  } finally {
    await browser.close();
  }
}

export async function loadPageText(url: string) {
  if (process.env.MOCK_OPENAI === "true") {
    return `Mock content for ${url}. Pricing, docs, security posture, deployment mode, and onboarding details are visible for evidence extraction.`;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "TargetIntelligenceEngine/0.1"
      }
    });
    const rawText = response.ok ? await response.text() : "";
    const normalized = normalizePageText(rawText);

    if (!shouldUseBrowserFallback(normalized)) {
      return normalized;
    }
  } catch {
  }

  try {
    return await loadWithPlaywright(url);
  } catch {
    return "";
  }
}
