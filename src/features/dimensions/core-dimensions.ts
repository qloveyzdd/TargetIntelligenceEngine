import type { Dimension } from "@/features/analysis-run/types";

export const coreDimensions: Dimension[] = [
  {
    id: "cost",
    name: "成本",
    weight: 0.18,
    direction: "lower_better",
    definition: "总体拥有成本、使用门槛，以及后续扩容带来的成本压力。",
    evidenceNeeded: ["pricing", "plan_limit", "deployment_cost"],
    layer: "core",
    enabled: true
  },
  {
    id: "performance",
    name: "性能",
    weight: 0.18,
    direction: "higher_better",
    definition: "响应时延、吞吐能力、结果质量，以及整体运行效率。",
    evidenceNeeded: ["latency", "speed", "quality_signal"],
    layer: "core",
    enabled: true
  },
  {
    id: "usability",
    name: "易用性",
    weight: 0.16,
    direction: "higher_better",
    definition: "上手是否清晰、完成任务是否顺畅，以及整体学习成本高不高。",
    evidenceNeeded: ["onboarding", "ux_flow", "documentation"],
    layer: "core",
    enabled: true
  },
  {
    id: "ecosystem",
    name: "生态",
    weight: 0.16,
    direction: "higher_better",
    definition: "集成能力、扩展空间，以及周边合作与社区支持情况。",
    evidenceNeeded: ["integrations", "api", "community"],
    layer: "core",
    enabled: true
  },
  {
    id: "reliability",
    name: "可靠性",
    weight: 0.16,
    direction: "higher_better",
    definition: "可用性是否稳定、运行是否可靠，以及出现问题后的恢复能力。",
    evidenceNeeded: ["sla", "status", "incident_history"],
    layer: "core",
    enabled: true
  },
  {
    id: "compliance",
    name: "合规性",
    weight: 0.16,
    direction: "higher_better",
    definition: "安全能力、政策适配、区域限制，以及治理与权限控制能力。",
    evidenceNeeded: ["security", "compliance", "deployment_mode"],
    layer: "core",
    enabled: true
  }
];
