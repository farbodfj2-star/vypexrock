import type { PricingPlan } from "@/types";

export const pricingPlans: PricingPlan[] = [
  {
    name: "Free",
    price: "$0",
    description: "A clean entry into Vypexrock with live prices, dashboard access, and core research views.",
    cta: "Current access",
    features: ["Live dashboard", "Basic AI answers", "Core watchlist", "Community feed"],
    lockedNote: "Premium AI signals, advanced backtesting, and Telegram delivery stay gated."
  },
  {
    name: "Pro",
    price: "$29/mo",
    badge: "Most popular",
    description: "Built for serious traders who want ranked setups, deeper risk tooling, and richer performance context.",
    cta: "Upgrade to Pro",
    features: ["Top AI-ranked setups", "Signal history + win rate", "Advanced Backtest Lab", "Risk calculator", "Telegram alerts"]
  },
  {
    name: "Elite",
    price: "$79/mo",
    badge: "Premium AI",
    description: "A higher-touch research tier for traders who want the most complete Vypexrock workspace.",
    cta: "Request early access",
    features: ["Premium AI signal mode", "Community Pro analytics", "Priority model routing", "Expanded performance tracking", "Private briefing features"]
  }
];
