import { describe, expect, it } from "vitest";
import { coerceEvidencePayload } from "./schema";

describe("evidence schema", () => {
  it("coerces a valid evidence payload", () => {
    const payload = coerceEvidencePayload({
      evidence: [
        {
          candidateId: "productboard-com",
          dimensionId: "usability",
          sourceType: "official_site",
          url: "https://www.productboard.com",
          excerpt: "Designed to align teams.",
          extractedValue: "alignment workflow",
          confidence: 0.8,
          capturedAt: "2026-04-10T00:00:00.000Z"
        }
      ]
    });

    expect(payload).not.toBeNull();
    expect(payload?.[0]?.sourceType).toBe("official_site");
  });

  it("rejects incomplete evidence records", () => {
    const payload = coerceEvidencePayload({
      evidence: [
        {
          candidateId: "productboard-com"
        }
      ]
    });

    expect(payload).toBeNull();
  });
});
