import { describe, expect, it } from "vitest";
import { coerceCandidateDraftPayload } from "./candidate-schema";

describe("candidate schema", () => {
  it("coerces a valid candidate draft payload", () => {
    const payload = coerceCandidateDraftPayload({
      candidates: [
        {
          name: "OpenAI Responses",
          officialUrl: "https://platform.openai.com/docs/api-reference/responses",
          strengthDimensions: ["performance"],
          sources: [
            {
              sourceType: "official_site",
              url: "https://platform.openai.com/docs/api-reference/responses"
            }
          ]
        }
      ]
    });

    expect(payload).not.toBeNull();
    expect(payload?.[0]?.sources[0]?.sourceType).toBe("official_site");
  });

  it("rejects invalid source payloads", () => {
    const payload = coerceCandidateDraftPayload({
      candidates: [
        {
          name: "Broken Candidate",
          officialUrl: "notaurl",
          strengthDimensions: ["performance"],
          sources: [
            {
              sourceType: "official_site",
              url: "notaurl"
            }
          ]
        }
      ]
    });

    expect(payload).toBeNull();
  });
});
