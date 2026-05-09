import type { AiMessage } from "@/types";

export const aiPromptChips = [
  "What is Bitcoin?",
  "What does RSI mean?",
  "Explain stop loss in simple words",
  "What is the best crypto opportunity right now?",
  "Should I buy BTC now?",
  "What is the difference between 15m and 4h?",
  "Explain long, short, and neutral",
  "What is your name?",
  "Explain black holes simply",
  "Best places to visit in Tokyo"
];

export const aiWelcomeMessages: AiMessage[] = [
  {
    id: "welcome-1",
    role: "assistant",
    content:
      "I'm Vypexrock AI. Ask me about crypto, charts, trading workflow, risk, market structure, or completely unrelated general questions. I’ll answer clearly and naturally, not like a stiff template bot.",
    mode: "long",
    status: "fallback"
  }
];

type ResponseContext = {
  text: string;
  shortMode: boolean;
};

export function getVypexrockAiReply(input: string, mode: "short" | "long" = "long"): string {
  const text = input.trim().toLowerCase();
  const ctx: ResponseContext = { text, shortMode: mode === "short" };

  if (matches(ctx, ["what is your name", "who are you", "your name"])) {
    return "I'm Vypexrock AI.";
  }

  if (matches(ctx, ["what is bitcoin", "explain bitcoin"])) {
    return reply(
      ctx,
      "Bitcoin is the original decentralized digital asset. It has a fixed supply, no central issuer, and it usually acts like the center of gravity for the crypto market because liquidity, attention, and risk appetite often flow through it first."
    );
  }

  if (matches(ctx, ["what is stop loss", "explain stop loss"])) {
    return reply(
      ctx,
      "A stop loss is the price level where you exit because the setup is no longer valid. In simple words, it is the line that tells you the idea is wrong, so your loss stays controlled instead of turning into hope."
    );
  }

  if (matches(ctx, ["manage risk", "risk management"])) {
    return reply(
      ctx,
      "Good risk management means risking small on each idea, only trading when the setup is clear, and deciding your invalidation before you enter. The goal is not to win every trade. The goal is to stay consistent enough that good setups matter over time."
    );
  }

  if (matches(ctx, ["what does rsi mean", "explain rsi"])) {
    return reply(
      ctx,
      "RSI measures momentum, not value. A high RSI says price has been pushing strongly. A low RSI says momentum has cooled off. The important part is context, because strong trends can keep RSI stretched much longer than beginners expect."
    );
  }

  if (matches(ctx, ["ema", "macd", "indicator"])) {
    return reply(
      ctx,
      "EMA helps you see trend direction and dynamic support or resistance. MACD helps you see whether momentum is accelerating or fading. Put together, they help answer two different questions: where the trend is, and whether that trend still has energy."
    );
  }

  if (matches(ctx, ["long vs short", "long short neutral", "neutral mean"])) {
    return reply(
      ctx,
      "Long means you want price to rise. Short means you want price to fall. Neutral means the market may still move, but the chart is not offering a clean enough edge to justify forcing a trade right now."
    );
  }

  if (matches(ctx, ["what timeframe should i use", "difference between 15m and 4h"])) {
    return reply(
      ctx,
      "Use 15m when you want precision and faster execution. Use 4h when you want cleaner structure and less noise. A strong workflow is to get your bias from the higher timeframe, then use the lower timeframe only to refine the actual entry."
    );
  }

  if (matches(ctx, ["what is the best crypto opportunity right now", "best coin right now", "what should i buy right now", "should i buy btc now"])) {
    return reply(
      ctx,
      "The best opportunity is rarely the coin moving the fastest. It is usually the one with the cleanest structure, manageable downside, and the clearest invalidation. If I had to narrow the field, I would usually start with BTC, ETH, or SOL before thinner names, but I still would not treat that as a blind buy. I would wait for a clean entry rather than chase heat."
    );
  }

  if (matches(ctx, ["market cap", "what is market cap"])) {
    return reply(
      ctx,
      "Market cap is the circulating supply multiplied by the current price. It helps compare the relative size of projects, but by itself it does not tell you whether the coin is liquid, strong, or worth trading."
    );
  }

  if (matches(ctx, ["black hole", "black holes"])) {
    return reply(
      ctx,
      "A black hole is a region of space where gravity becomes so strong that once something crosses the event horizon, even light cannot get back out. The simplest way to picture it is as an extreme warping of space and time caused by an incredibly dense mass."
    );
  }

  if (matches(ctx, ["tokyo", "visit tokyo", "places to visit in tokyo"])) {
    return reply(
      ctx,
      "For a strong first Tokyo trip, combine Shibuya and Shinjuku for energy, Asakusa for history, Ginza for polished shopping, and teamLab or Odaiba for modern visual culture. Tokyo is best experienced as a mix of neighborhoods with completely different personalities."
    );
  }

  if (matches(ctx, ["should i take long or short", "long or short now", "which side should i take"])) {
    return reply(
      ctx,
      "I would not answer that blindly without the specific chart, timeframe, and current price location. The right way to decide is simple: long when structure is reclaiming with momentum, short when structure is breaking down with failed bounces, and wait when price is trapped in the middle."
    );
  }

  if (matches(ctx, ["any question", "can you answer anything", "are you smart"])) {
    return reply(
      ctx,
      "Yes. I can help with crypto, trading, indicators, market reasoning, tech topics, science, travel, and general questions. If the question is opinion-based, I will tell you what I think and where the uncertainty is."
    );
  }

  return reply(
    ctx,
    "Here is how I would frame it. First, clarify what the question is really asking. Then separate the strongest facts from noise. Finally, decide what action actually makes sense, what assumptions are being made, and where caution still matters."
  );
}

function matches(ctx: ResponseContext, patterns: string[]) {
  return patterns.some((pattern) => ctx.text.includes(pattern));
}

function reply(ctx: ResponseContext, longText: string) {
  if (ctx.shortMode) {
    return longText.split(". ")[0] + ".";
  }
  return longText;
}
