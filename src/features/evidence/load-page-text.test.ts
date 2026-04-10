import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadPageText, normalizePageText, shouldUseBrowserFallback } from "./load-page-text";

describe("load page text", () => {
  beforeEach(() => {
    delete process.env.MOCK_OPENAI;
  });

  it("returns mock text when MOCK_OPENAI is enabled", async () => {
    process.env.MOCK_OPENAI = "true";

    const text = await loadPageText("https://example.com");

    expect(text).toContain("Mock content");
  });

  it("normalizes html fetched from the page", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        "<html><body><h1>Hello</h1><p>World and a much longer body that keeps the fetch-first path active without triggering browser fallback. This text is intentionally verbose so the normalized output stays above the fallback threshold for the unit test. It repeats the key product facts several times: pricing visibility, deployment details, onboarding clarity, docs quality, ecosystem depth, reliability signals, compliance posture, and workflow support. The purpose of this paragraph is only to make the mocked fetch response long enough that the browser fallback path is not used during the test run.</p></body></html>"
    });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = fetchMock as typeof fetch;

    try {
      const text = await loadPageText("https://example.com");

      expect(text).toContain("Hello World");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("marks very short text for browser fallback", () => {
    expect(normalizePageText("<p>short</p>")).toBe("short");
    expect(shouldUseBrowserFallback("short")).toBe(true);
  });

  it("returns empty text when fetch and browser fallback both fail", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn().mockRejectedValue(new Error("fetch failed"));

    globalThis.fetch = fetchMock as typeof fetch;

    vi.doMock("playwright", () => ({
      chromium: {
        launch: vi.fn().mockRejectedValue(new Error("browser failed"))
      }
    }));

    try {
      const text = await loadPageText("https://example.com/unreachable");

      expect(text).toBe("");
    } finally {
      globalThis.fetch = originalFetch;
      vi.doUnmock("playwright");
    }
  });
});
