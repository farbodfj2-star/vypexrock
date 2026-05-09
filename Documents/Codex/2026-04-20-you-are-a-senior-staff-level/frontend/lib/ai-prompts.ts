export const aiAnswerModes = [
  {
    key: "quick",
    label: "Quick answer",
    apiMode: "short" as const,
    prefix: "Answer briefly and clearly."
  },
  {
    key: "detailed",
    label: "Detailed analysis",
    apiMode: "long" as const,
    prefix: "Answer with structured analysis: summary, market bias if relevant, key reasons, risk factors, suggested plan, and a short disclaimer."
  },
  {
    key: "risk",
    label: "Risk-focused answer",
    apiMode: "long" as const,
    prefix: "Focus on risk, invalidation, probability, position sizing, and what could go wrong."
  },
  {
    key: "beginner",
    label: "Beginner explanation",
    apiMode: "long" as const,
    prefix: "Explain simply for a beginner without sounding childish. Use clean plain English."
  }
] as const;

export type AiAnswerModeKey = (typeof aiAnswerModes)[number]["key"];
