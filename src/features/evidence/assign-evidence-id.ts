import { createHash } from "node:crypto";
import type { Evidence } from "@/features/analysis-run/types";

type EvidenceIdentityInput = Pick<
  Evidence,
  "candidateId" | "dimensionId" | "sourceType" | "url" | "excerpt" | "extractedValue"
>;

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    return url.toString().toLowerCase();
  } catch {
    return normalizeText(value);
  }
}

export function assignEvidenceId(input: EvidenceIdentityInput) {
  const digest = createHash("sha1")
    .update(
      JSON.stringify([
        normalizeText(input.candidateId),
        normalizeText(input.dimensionId),
        normalizeText(input.sourceType),
        normalizeUrl(input.url),
        normalizeText(input.excerpt),
        normalizeText(input.extractedValue)
      ])
    )
    .digest("hex")
    .slice(0, 16);

  return `evi-${digest}`;
}
