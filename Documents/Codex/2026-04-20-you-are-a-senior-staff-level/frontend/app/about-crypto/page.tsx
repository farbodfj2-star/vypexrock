"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Brain, CandlestickChart, CheckCircle2, Coins, Cpu, Gauge, Network, ShieldAlert, Sparkles, X } from "lucide-react";

type ChapterId = "crypto" | "blockchain" | "candlesticks" | "technical" | "risk" | "psychology" | "ai";
type CandleTone = "bullish" | "bearish" | "neutral" | "contextual" | "momentum";
type CandleShape = {
  x: number;
  bodyTop: number;
  bodyHeight: number;
  wickTop: number;
  wickBottom: number;
  color: "green" | "red" | "gray";
};
type CandlePattern = {
  name: string;
  tone: CandleTone;
  meaning: string;
  appears: string;
  confirmation: string;
  risk: string;
  candles: CandleShape[];
};

const chapters: Array<{ id: ChapterId; label: string }> = [
  { id: "crypto", label: "Crypto basics" },
  { id: "blockchain", label: "Blockchain" },
  { id: "candlesticks", label: "Candlesticks" },
  { id: "technical", label: "Technical analysis" },
  { id: "risk", label: "Risk" },
  { id: "psychology", label: "Psychology" },
  { id: "ai", label: "AI" }
];

const patterns: CandlePattern[] = [
  pattern("Hammer", "bullish", "A small body near the high with a long lower wick. Buyers absorbed selling pressure.", "After a decline or at support.", "Next candle should hold above the hammer high or reclaim nearby structure.", "A hammer inside a strong downtrend can fail quickly without volume."),
  pattern("Inverted Hammer", "bullish", "Small body near the low with a long upper wick. Buyers tested higher prices but still need follow-through.", "After a downtrend or capitulation wick.", "Confirm with a close above the inverted hammer high.", "Upper wick shows sellers are still active."),
  pattern("Shooting Star", "bearish", "Small body near the low with a long upper wick. Buyers pushed up and were rejected.", "After an uptrend or near resistance.", "Confirm with a close below the shooting star low.", "In strong trends, shooting stars can become continuation pauses."),
  pattern("Doji", "neutral", "Open and close are nearly equal. The market is undecided.", "At exhaustion points, ranges, or after extended moves.", "Wait for the next candle to break the doji range.", "A doji alone is not a reversal signal."),
  pattern("Dragonfly Doji", "bullish", "Open and close near the high with a long lower wick. Sellers failed to hold lows.", "After a decline or into support.", "Confirm with a bullish close above the high.", "Needs context; in weak markets it can become only a pause."),
  pattern("Gravestone Doji", "bearish", "Open and close near the low with a long upper wick. Buyers failed to hold highs.", "After a rally or into resistance.", "Confirm with a bearish close below the low.", "Can fail if price reclaims the wick high."),
  pattern("Bullish Engulfing", "bullish", "A green candle fully engulfs the prior red body, showing buyer control.", "After weakness, ideally at support.", "Confirm with volume and continuation above the engulfing high.", "Late entries after the engulfing candle often have poor risk/reward."),
  pattern("Bearish Engulfing", "bearish", "A red candle fully engulfs the prior green body, showing seller control.", "After strength, ideally at resistance.", "Confirm with continuation below the engulfing low.", "Can trap shorts if it forms into support."),
  pattern("Morning Star", "bullish", "Three-candle reversal: red candle, small indecision candle, strong green reclaim.", "After a downtrend.", "Confirm with a close above the midpoint of the first red candle.", "Works best with support and rising volume."),
  pattern("Evening Star", "bearish", "Three-candle reversal: green candle, indecision candle, strong red rejection.", "After an uptrend.", "Confirm with a close below the midpoint of the first green candle.", "Can fail during aggressive bullish continuation."),
  pattern("Three White Soldiers", "bullish", "Three consecutive strong green candles with higher closes.", "After a base or reversal zone.", "Confirm that the third candle is not overextended into resistance.", "Chasing the third candle often increases drawdown risk."),
  pattern("Three Black Crows", "bearish", "Three consecutive strong red candles with lower closes.", "After distribution or failed highs.", "Confirm that support has broken and retest fails.", "Shorting after three red candles can be late."),
  pattern("Pin Bar", "contextual", "A rejection candle with a long wick and small body. Direction depends on wick location.", "At support, resistance, or liquidity sweeps.", "Trade only when the next candle accepts the rejection direction.", "Random pin bars inside chop are low quality."),
  pattern("Inside Bar", "neutral", "A smaller candle fully contained inside the previous candle range. Volatility compresses.", "During pauses before expansion.", "Wait for range break and retest.", "Breakouts can fake out both sides."),
  pattern("Marubozu", "momentum", "A large body with tiny or no wicks. One side controlled the candle.", "During strong trend expansion or news moves.", "Confirm with continuation or a controlled retest.", "Momentum candles can be exhaustion if entered too late.")
];

const technicalConcepts = [
  ["Support", "Where buyers previously defended price."],
  ["Resistance", "Where sellers previously rejected price."],
  ["Breakout", "A move through structure that needs volume and acceptance."],
  ["Fakeout", "A failed break that traps late traders."],
  ["Retest", "A return to the broken level to confirm role reversal."],
  ["RSI", "Momentum context, not an automatic buy or sell signal."],
  ["MACD", "Trend and momentum shift confirmation."],
  ["ATR", "Volatility tool for stops and target spacing."]
];

export default function AboutCryptoPage() {
  const [activeChapter, setActiveChapter] = useState<ChapterId>("crypto");
  const [selectedPattern, setSelectedPattern] = useState<CandlePattern | null>(null);
  const [quizOpen, setQuizOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveChapter(visible.target.id as ChapterId);
      },
      { threshold: [0.34, 0.52, 0.72], rootMargin: "-10% 0px -30% 0px" }
    );

    chapters.forEach((chapter) => {
      const element = document.getElementById(chapter.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  function scrollToScene(id: ChapterId) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="crypto-film relative pb-12">
      <FilmProgress activeChapter={activeChapter} onNavigate={scrollToScene} />

      <HeroScene />

      <Scene id="crypto" eyebrow="Scene 01" title="What is crypto?" subtitle="Money, ownership, and software moving on open rails." visual={<CryptoVisual />}>
        <NarrativeBlock
          title="Crypto is digital value with programmable rules."
          body="Cryptocurrency lets people send, store, and verify value through networks instead of a single central database. Bitcoin introduced scarce digital money. Ethereum expanded the idea into programmable finance. Altcoins, stablecoins, and tokens all sit inside this wider ecosystem."
        />
        <SceneFacts
          facts={[
            ["Bitcoin", "Scarcity and settlement"],
            ["Ethereum", "Programmable contracts"],
            ["Stablecoins", "Digital dollar rails"],
            ["Liquidity", "How easily price can move"]
          ]}
        />
        <QuizCheckpoint
          id="crypto-quiz"
          question="Is market cap the same as available cash liquidity?"
          answer="No. Market cap is price multiplied by circulating supply. Liquidity is how much can actually trade near the current price."
          open={Boolean(quizOpen["crypto-quiz"])}
          onToggle={() => setQuizOpen((current) => ({ ...current, "crypto-quiz": !current["crypto-quiz"] }))}
        />
      </Scene>

      <Scene id="blockchain" eyebrow="Scene 02" title="Blockchain" subtitle="A shared ledger, verified by many participants, designed to be hard to rewrite." visual={<BlockchainVisual />}>
        <NarrativeBlock
          title="Blocks create history. Consensus protects it."
          body="A blockchain records transactions into blocks. Network participants agree on the valid version of history through consensus. Decentralization means no single operator should be able to quietly change balances, censor everyone, or rewrite the ledger alone."
        />
        <SceneFacts
          facts={[
            ["Block", "A packet of verified transactions"],
            ["Node", "A computer checking network rules"],
            ["Consensus", "Agreement on valid history"],
            ["Finality", "Confidence that history will not change"]
          ]}
        />
      </Scene>

      <section id="candlesticks" className="crypto-scene candle-cinema min-h-screen scroll-mt-24">
        <div className="scene-shell">
          <div className="scene-copy">
            <p className="scene-eyebrow">Scene 03</p>
            <h2 className="scene-title">Candlesticks are market emotion compressed into shape.</h2>
            <p className="scene-subtitle">
              Click a pattern. The detail view opens like a trading film frame, with accurate candle structure, meaning, confirmation, and risk.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {patterns.map((item, index) => (
              <button key={item.name} type="button" className="pattern-film-card text-left" onClick={() => setSelectedPattern(item)}>
                <AccuratePatternSvg pattern={item} compact />
                <div className="mt-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                  <span className={`tone-pill tone-${item.tone}`}>{item.tone}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/58">{item.meaning}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <Scene id="technical" eyebrow="Scene 04" title="Technical analysis" subtitle="Structure first. Indicators second. Confirmation always." visual={<MarketStructureVisual />}>
        <div className="grid gap-3 sm:grid-cols-2">
          {technicalConcepts.map(([title, body]) => (
            <div key={title} className="film-mini-card">
              <h3 className="text-base font-semibold text-white">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/58">{body}</p>
            </div>
          ))}
        </div>
      </Scene>

      <Scene id="risk" eyebrow="Scene 05" title="Risk management" subtitle="The trade is not the prediction. The trade is the risk plan." visual={<RiskVisual />}>
        <NarrativeBlock
          title="Professional traders define invalidation before entry."
          body="Entry, stop loss, take profit, position size, and risk/reward must work together. A good setup can still lose. A bad risk plan can destroy even correct analysis."
        />
        <SceneFacts facts={[["Entry", "Where the scenario begins"], ["Stop loss", "Where the idea is wrong"], ["Take profit", "Where risk is reduced"], ["Position size", "How much loss is acceptable"]]} />
        <QuizCheckpoint
          id="risk-quiz"
          question="Can a profitable strategy still go through losing streaks?"
          answer="Yes. That is why fixed risk, stop losses, and position sizing matter more than confidence alone."
          open={Boolean(quizOpen["risk-quiz"])}
          onToggle={() => setQuizOpen((current) => ({ ...current, "risk-quiz": !current["risk-quiz"] }))}
        />
      </Scene>

      <Scene id="psychology" eyebrow="Scene 06" title="Trading psychology" subtitle="The hardest market to trade is the one inside your head." visual={<PsychologyVisual />}>
        <SceneFacts
          facts={[
            ["FOMO", "Entering because price moved without you"],
            ["Revenge", "Trying to win losses back immediately"],
            ["Overtrading", "Mistaking activity for edge"],
            ["Patience", "Letting no-trade be a real decision"]
          ]}
        />
        <NarrativeBlock
          title="Waiting is not weakness."
          body="No Trade protects capital when structure is unclear, volatility is hostile, or risk/reward is poor. In Vypexrock, Wait is treated as a professional decision, not a missing signal."
        />
      </Scene>

      <Scene id="ai" eyebrow="Final scene" title="AI trading" subtitle="AI can accelerate analysis. It cannot remove uncertainty." visual={<AiTerminalVisual />}>
        <NarrativeBlock
          title="Vypexrock AI is a decision-support layer."
          body="AI can summarize structure, compare scenarios, explain indicators, estimate risk zones, and prepare a briefing. But it cannot guarantee outcomes. Markets react to liquidity, news, emotion, and leverage in ways no model controls."
        />
        <div className="rounded-[1.7rem] border border-amber-300/20 bg-amber-300/10 p-5 text-sm leading-7 text-amber-100">
          Not financial advice. Historical performance does not guarantee future results. Crypto and leveraged products carry significant risk. Use stop losses and position sizing.
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/chart-analyzer" className="chart-ai-button inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white">
            Analyze a chart
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/ai" className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.09]">
            Ask Vypexrock AI
          </Link>
        </div>
      </Scene>

      {selectedPattern ? <PatternModal pattern={selectedPattern} onClose={() => setSelectedPattern(null)} /> : null}
    </div>
  );
}

function HeroScene() {
  return (
    <section className="crypto-film-hero min-h-[84vh] rounded-[2.8rem] p-7 lg:p-12">
      <div className="relative z-10 grid min-h-[70vh] items-center gap-10 xl:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm text-amber-100">
            <Sparkles className="h-4 w-4" />
            Vypexrock Interactive Documentary
          </div>
          <h1 className="mt-7 max-w-5xl text-5xl font-semibold leading-[0.95] text-white md:text-7xl xl:text-8xl">
            Crypto, explained like a film you can trade from.
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-8 text-white/64 lg:text-lg">
            Scroll through chapters on crypto, blockchain, candles, risk, psychology, and AI. Each scene is built to teach market structure visually, not bury you in textbook cards.
          </p>
        </div>
        <div className="hero-orbital-stage">
          <CryptoVisual />
          <div className="hero-floating-note note-one">Risk first</div>
          <div className="hero-floating-note note-two">No guarantees</div>
          <div className="hero-floating-note note-three">Confirm structure</div>
        </div>
      </div>
    </section>
  );
}

function FilmProgress({ activeChapter, onNavigate }: { activeChapter: ChapterId; onNavigate: (id: ChapterId) => void }) {
  return (
    <nav className="film-progress hidden 2xl:block" aria-label="About Crypto scenes">
      {chapters.map((chapter, index) => (
        <button
          key={chapter.id}
          type="button"
          onClick={() => onNavigate(chapter.id)}
          className={`film-progress-item ${activeChapter === chapter.id ? "film-progress-active" : ""}`}
        >
          <span>{String(index + 1).padStart(2, "0")}</span>
          {chapter.label}
        </button>
      ))}
    </nav>
  );
}

function Scene({
  id,
  eyebrow,
  title,
  subtitle,
  visual,
  children
}: {
  id: ChapterId;
  eyebrow: string;
  title: string;
  subtitle: string;
  visual: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="crypto-scene min-h-screen scroll-mt-24">
      <div className="scene-shell">
        <div className="scene-grid">
          <div className="scene-copy">
            <p className="scene-eyebrow">{eyebrow}</p>
            <h2 className="scene-title">{title}</h2>
            <p className="scene-subtitle">{subtitle}</p>
            <div className="mt-7 space-y-5">{children}</div>
          </div>
          <div className="scene-visual">{visual}</div>
        </div>
      </div>
    </section>
  );
}

function NarrativeBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="film-narrative">
      <h3 className="text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-white/62">{body}</p>
    </div>
  );
}

function SceneFacts({ facts }: { facts: string[][] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {facts.map(([label, value]) => (
        <div key={label} className="film-mini-card">
          <p className="text-xs uppercase tracking-[0.2em] text-white/38">{label}</p>
          <p className="mt-2 text-sm font-medium text-white/82">{value}</p>
        </div>
      ))}
    </div>
  );
}

function QuizCheckpoint({ id, question, answer, open, onToggle }: { id: string; question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="quiz-checkpoint" id={id}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/60">Checkpoint</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{question}</h3>
        </div>
        <button type="button" onClick={onToggle} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/15">
          {open ? "Hide answer" : "Reveal answer"}
        </button>
      </div>
      <div className={`quiz-answer ${open ? "quiz-answer-open" : ""}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-300" />
        <p>{answer}</p>
      </div>
    </div>
  );
}

function PatternModal({ pattern, onClose }: { pattern: CandlePattern; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4 backdrop-blur-2xl" role="dialog" aria-modal="true">
      <div className="pattern-modal w-full max-w-5xl">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1]" aria-label="Close pattern detail">
          <X className="h-5 w-5" />
        </button>
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="pattern-modal-stage">
            <AccuratePatternSvg pattern={pattern} large />
          </div>
          <div className="py-2 lg:pr-10">
            <span className={`tone-pill tone-${pattern.tone}`}>{pattern.tone}</span>
            <h2 className="mt-4 text-4xl font-semibold text-white">{pattern.name}</h2>
            <p className="mt-4 text-base leading-8 text-white/68">{pattern.meaning}</p>
            <div className="mt-7 grid gap-4">
              <DetailLine title="When it appears" text={pattern.appears} />
              <DetailLine title="Confirmation needed" text={pattern.confirmation} />
              <DetailLine title="Risk warning" text={pattern.risk} warning />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailLine({ title, text, warning = false }: { title: string; text: string; warning?: boolean }) {
  return (
    <div className={`rounded-[1.35rem] border p-4 ${warning ? "border-amber-300/20 bg-amber-300/10" : "border-white/10 bg-white/[0.04]"}`}>
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{title}</p>
      <p className={`mt-2 text-sm leading-7 ${warning ? "text-amber-100" : "text-white/64"}`}>{text}</p>
    </div>
  );
}

function AccuratePatternSvg({ pattern, compact = false, large = false }: { pattern: CandlePattern; compact?: boolean; large?: boolean }) {
  const width = large ? 520 : compact ? 220 : 320;
  const height = large ? 320 : compact ? 128 : 190;
  const scaleX = width / 220;
  const scaleY = height / 128;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible" role="img" aria-label={`${pattern.name} candlestick diagram`}>
      <defs>
        <linearGradient id={`grid-${pattern.name}`} x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(56,189,248,0.08)" />
          <stop offset="100%" stopColor="rgba(168,85,247,0.08)" />
        </linearGradient>
        <filter id={`glow-${pattern.name}`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <rect width={width} height={height} rx="24" fill="rgba(2,6,23,0.72)" />
      {[0, 1, 2, 3].map((line) => (
        <line key={`h-${line}`} x1="14" x2={width - 14} y1={(26 + line * 25) * scaleY} y2={(26 + line * 25) * scaleY} stroke="rgba(255,255,255,0.07)" />
      ))}
      {[0, 1, 2, 3, 4].map((line) => (
        <line key={`v-${line}`} y1="12" y2={height - 12} x1={(28 + line * 40) * scaleX} x2={(28 + line * 40) * scaleX} stroke="rgba(255,255,255,0.055)" />
      ))}
      {pattern.candles.map((candle, index) => {
        const color = candle.color === "green" ? "#22d3ee" : candle.color === "red" ? "#fb3f5f" : "#cbd5e1";
        const x = candle.x * scaleX;
        const bodyWidth = (large ? 18 : compact ? 9 : 13) * scaleX;
        const wickTop = candle.wickTop * scaleY;
        const wickBottom = candle.wickBottom * scaleY;
        const bodyTop = candle.bodyTop * scaleY;
        const bodyHeight = Math.max(candle.bodyHeight * scaleY, large ? 4 : 2);
        return (
          <g key={`${pattern.name}-${index}`} className="accurate-candle" style={{ animationDelay: `${index * 110}ms` }} filter={`url(#glow-${pattern.name})`}>
            <line x1={x} x2={x} y1={wickTop} y2={wickBottom} stroke={color} strokeWidth={large ? 3 : 2} strokeLinecap="round" opacity="0.9" />
            <rect x={x - bodyWidth / 2} y={bodyTop} width={bodyWidth} height={bodyHeight} rx={large ? 4 : 2} fill={color} opacity={candle.color === "gray" ? 0.72 : 0.9} />
          </g>
        );
      })}
    </svg>
  );
}

function CryptoVisual() {
  return (
    <div className="crypto-visual-stage">
      <div className="coin-orbit coin-orbit-one"><span>BTC</span></div>
      <div className="coin-orbit coin-orbit-two"><span>ETH</span></div>
      <div className="coin-orbit coin-orbit-three"><span>AI</span></div>
      <MiniChartPanel />
    </div>
  );
}

function BlockchainVisual() {
  return (
    <div className="blockchain-stage">
      {Array.from({ length: 9 }).map((_, index) => (
        <div key={index} className="chain-node" style={{ left: `${18 + (index % 3) * 30}%`, top: `${18 + Math.floor(index / 3) * 28}%`, animationDelay: `${index * 120}ms` }}>
          <Network className="h-5 w-5" />
        </div>
      ))}
      <svg className="absolute inset-0 h-full w-full">
        <path d="M90 85 L235 85 L380 85 M90 200 L235 200 L380 200 M90 315 L235 315 L380 315 M90 85 L90 200 L90 315 M235 85 L235 200 L235 315 M380 85 L380 200 L380 315 M90 85 L235 200 L380 315 M380 85 L235 200 L90 315" stroke="rgba(125,211,252,0.2)" strokeWidth="2" strokeDasharray="7 8" className="forecast-path-draw" />
      </svg>
    </div>
  );
}

function MarketStructureVisual() {
  return (
    <div className="market-structure-stage">
      <MiniChartPanel />
      <div className="structure-label structure-support">Support</div>
      <div className="structure-label structure-resistance">Resistance</div>
      <div className="structure-label structure-breakout">Breakout then retest</div>
    </div>
  );
}

function RiskVisual() {
  return (
    <div className="risk-stage">
      <div className="risk-chart-line" />
      <div className="risk-zone risk-reward">Reward zone</div>
      <div className="risk-zone risk-loss">Risk zone</div>
      <div className="risk-level risk-entry">Entry</div>
      <div className="risk-level risk-stop">Stop Loss</div>
      <div className="risk-level risk-tp">Take Profit</div>
    </div>
  );
}

function PsychologyVisual() {
  return (
    <div className="psychology-stage">
      {["FOMO", "Revenge", "Patience", "Discipline", "No Trade"].map((item, index) => (
        <div key={item} className="mind-bubble" style={{ animationDelay: `${index * 220}ms` }}>
          {item}
        </div>
      ))}
    </div>
  );
}

function AiTerminalVisual() {
  return (
    <div className="ai-terminal-stage">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-white"><Cpu className="h-4 w-4 text-cyan-200" /> Vypexrock AI briefing</span>
        <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs text-emerald-200">Live reasoning</span>
      </div>
      <div className="space-y-3 p-5">
        {["Reading market structure", "Checking invalidation", "Comparing risk/reward", "Preparing scenario"].map((item, index) => (
          <div key={item} className="ai-terminal-row" style={{ animationDelay: `${index * 180}ms` }}>
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.75)]" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniChartPanel() {
  return (
    <div className="mini-chart-panel">
      {[42, 56, 48, 74, 63, 96, 78, 112, 98, 130, 118, 145].map((height, index) => {
        const bullish = index % 3 !== 1;
        return (
          <span key={index} className="mini-candle-wrap">
            <span className={`mini-wick ${bullish ? "bg-cyan-200/70" : "bg-rose-200/70"}`} style={{ height: height + 34 }} />
            <span className={`mini-candle ${bullish ? "bg-cyan-400" : "bg-rose-400"}`} style={{ height }} />
          </span>
        );
      })}
    </div>
  );
}

function pattern(name: string, tone: CandleTone, meaning: string, appears: string, confirmation: string, risk: string): CandlePattern {
  return {
    name,
    tone,
    meaning,
    appears,
    confirmation,
    risk,
    candles: candleShapesFor(name)
  };
}

function candleShapesFor(name: string): CandleShape[] {
  const single: Record<string, CandleShape[]> = {
    Hammer: [c(110, 44, 18, 44, 112, "green")],
    "Inverted Hammer": [c(110, 68, 18, 12, 86, "green")],
    "Shooting Star": [c(110, 72, 16, 10, 88, "red")],
    Doji: [c(110, 63, 3, 28, 98, "gray")],
    "Dragonfly Doji": [c(110, 36, 3, 34, 112, "green")],
    "Gravestone Doji": [c(110, 92, 3, 16, 94, "red")],
    "Pin Bar": [c(110, 42, 14, 38, 112, "green")],
    Marubozu: [c(110, 26, 82, 26, 108, "green")]
  };

  if (single[name]) return single[name];
  if (name === "Bullish Engulfing") return [c(78, 56, 28, 42, 92, "red"), c(132, 28, 72, 22, 106, "green")];
  if (name === "Bearish Engulfing") return [c(78, 44, 28, 34, 86, "green"), c(132, 34, 72, 24, 112, "red")];
  if (name === "Morning Star") return [c(58, 38, 56, 30, 100, "red"), c(110, 82, 12, 68, 104, "gray"), c(162, 34, 58, 28, 96, "green")];
  if (name === "Evening Star") return [c(58, 34, 56, 28, 98, "green"), c(110, 30, 12, 18, 62, "gray"), c(162, 48, 58, 40, 112, "red")];
  if (name === "Three White Soldiers") return [c(58, 72, 34, 62, 112, "green"), c(110, 50, 36, 42, 94, "green"), c(162, 28, 38, 20, 74, "green")];
  if (name === "Three Black Crows") return [c(58, 24, 36, 16, 72, "red"), c(110, 44, 36, 34, 92, "red"), c(162, 66, 36, 56, 114, "red")];
  if (name === "Inside Bar") return [c(82, 28, 76, 18, 112, "green"), c(138, 54, 28, 44, 90, "red")];
  return [c(110, 52, 24, 34, 96, "gray")];
}

function c(x: number, bodyTop: number, bodyHeight: number, wickTop: number, wickBottom: number, color: CandleShape["color"]): CandleShape {
  return { x, bodyTop, bodyHeight, wickTop, wickBottom, color };
}
