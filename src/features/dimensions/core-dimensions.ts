import type { Dimension } from "@/features/analysis-run/types";

export const coreDimensions: Dimension[] = [
  {
    id: "cost",
    name: "Cost",
    weight: 0.18,
    direction: "lower_better",
    definition: "Total ownership cost, entry barrier, and scaling cost.",
    evidenceNeeded: ["pricing", "plan_limit", "deployment_cost"],
    layer: "core",
    enabled: true
  },
  {
    id: "performance",
    name: "Performance",
    weight: 0.18,
    direction: "higher_better",
    definition: "Latency, throughput, output quality, and operational speed.",
    evidenceNeeded: ["latency", "speed", "quality_signal"],
    layer: "core",
    enabled: true
  },
  {
    id: "usability",
    name: "Usability",
    weight: 0.16,
    direction: "higher_better",
    definition: "Onboarding clarity, task completion friction, and learning curve.",
    evidenceNeeded: ["onboarding", "ux_flow", "documentation"],
    layer: "core",
    enabled: true
  },
  {
    id: "ecosystem",
    name: "Ecosystem",
    weight: 0.16,
    direction: "higher_better",
    definition: "Integrations, extension surface, and partner support.",
    evidenceNeeded: ["integrations", "api", "community"],
    layer: "core",
    enabled: true
  },
  {
    id: "reliability",
    name: "Reliability",
    weight: 0.16,
    direction: "higher_better",
    definition: "Availability, operational stability, and recovery behavior.",
    evidenceNeeded: ["sla", "status", "incident_history"],
    layer: "core",
    enabled: true
  },
  {
    id: "compliance",
    name: "Compliance",
    weight: 0.16,
    direction: "higher_better",
    definition: "Security posture, policy fit, regional limits, and governance.",
    evidenceNeeded: ["security", "compliance", "deployment_mode"],
    layer: "core",
    enabled: true
  }
];
