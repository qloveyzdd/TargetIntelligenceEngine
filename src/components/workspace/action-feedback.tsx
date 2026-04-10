"use client";

import type { CSSProperties } from "react";

type ActionFeedbackProps = {
  tone: "neutral" | "pending" | "success" | "error";
  message: string;
};

const toneStyles: Record<ActionFeedbackProps["tone"], CSSProperties> = {
  neutral: {
    background: "rgba(255,255,255,0.72)",
    borderColor: "var(--card-border)",
    color: "var(--text-muted)"
  },
  pending: {
    background: "rgba(255, 243, 205, 0.8)",
    borderColor: "rgba(214, 167, 38, 0.35)",
    color: "#8a5a00"
  },
  success: {
    background: "rgba(220, 252, 231, 0.8)",
    borderColor: "rgba(34, 197, 94, 0.25)",
    color: "#166534"
  },
  error: {
    background: "rgba(254, 226, 226, 0.8)",
    borderColor: "rgba(220, 38, 38, 0.2)",
    color: "#b12424"
  }
};

export function ActionFeedback({ tone, message }: ActionFeedbackProps) {
  return (
    <p style={{ ...styles.base, ...toneStyles[tone] }} data-testid="action-feedback">
      {message}
    </p>
  );
}

const styles = {
  base: {
    border: "1px solid",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.6,
    margin: 0,
    padding: "10px 12px"
  }
} satisfies Record<string, CSSProperties>;
