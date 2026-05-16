"use client";

import {
  Activity,
  BrainCircuit,
  ChevronRight,
  Eye,
  Layers,
  ScanLine,
  Send,
  ShieldCheck,
  Target,
  Telescope,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Kinetic, Reveal, Stagger } from "@/components/vx/cine-reveal";
import { MagneticButton, Tilt3D } from "@/components/vx/magnetic";
import { cn } from "@/lib/utils";

// ============================================================
// SECTION 1 · AI Sees Structure
// ============================================================

export function StructureSection() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] items-center">
          <Reveal variant="left">
            <div className="space-y-6 max-w-xl">
              <span className="vx-cine-eyebrow">01 · AI vision</span>
              <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2.2rem,5vw,4.4rem)" }}>
                <Kinetic text="The market" />
                <br />
                <Kinetic
                  text="speaks in structure."
                  highlightRange={[1, 1]}
                />
              </h2>
              <p className="vx-cine-sub">
                While retail chases candles, our engine reads liquidity, order
                blocks, and momentum across timeframes. Every signal arrives
                with reasoning — not a black-box probability.
              </p>
              <Stagger className="space-y-4">
                <FeatureRow
                  icon={<Eye className="h-5 w-5" />}
                  title="Pattern recognition"
                  body="Detects breakout setups, range compression, and liquidity sweeps."
                />
                <FeatureRow
                  icon={<Layers className="h-5 w-5" />}
                  title="Multi-timeframe sync"
                  body="15m for entry · 1H for momentum · 4H for trend alignment."
                />
                <FeatureRow
                  icon={<BrainCircuit className="h-5 w-5" />}
                  title="Explainable AI"
                  body="Every call surfaces the structural reason behind it."
                />
              </Stagger>
            </div>
          </Reveal>

          <Reveal variant="right">
            <Tilt3D max={6} className="vx-cine-tilt-bare">
              <div className="vx-cine-glass vx-cine-holo p-6 lg:p-8">
                <StructureViz />
              </div>
            </Tilt3D>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function StructureViz() {
  // Pure SVG synthetic chart with structure annotations.
  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
      <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="vxStructFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(94, 234, 212, 0.45)" />
            <stop offset="100%" stopColor="rgba(94, 234, 212, 0)" />
          </linearGradient>
          <linearGradient id="vxStructStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(94, 234, 212, 0.9)" />
            <stop offset="100%" stopColor="rgba(167, 139, 250, 0.95)" />
          </linearGradient>
          <filter id="vxGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Grid */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={`gx-${i}`}
            x1="0"
            y1={i * 80 + 40}
            x2="800"
            y2={i * 80 + 40}
            stroke="rgba(255,255,255,0.04)"
          />
        ))}

        {/* Filled price area */}
        <path
          d="M 0 380 C 80 360, 140 350, 200 330 S 320 280, 380 260 C 460 240, 520 240, 580 200 C 640 170, 720 180, 800 130 L 800 500 L 0 500 Z"
          fill="url(#vxStructFill)"
        />
        {/* Glowing line */}
        <path
          d="M 0 380 C 80 360, 140 350, 200 330 S 320 280, 380 260 C 460 240, 520 240, 580 200 C 640 170, 720 180, 800 130"
          fill="none"
          stroke="url(#vxStructStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          filter="url(#vxGlow)"
        />
        <path
          d="M 0 380 C 80 360, 140 350, 200 330 S 320 280, 380 260 C 460 240, 520 240, 580 200 C 640 170, 720 180, 800 130"
          fill="none"
          stroke="url(#vxStructStroke)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* HH and HL annotations */}
        {[
          { x: 200, y: 330, l: "HL" },
          { x: 380, y: 260, l: "HH" },
          { x: 580, y: 200, l: "HL" },
          { x: 740, y: 145, l: "HH" }
        ].map((a, i) => (
          <g key={i}>
            <circle cx={a.x} cy={a.y} r="6" fill="rgba(94,234,212,0.95)" />
            <circle cx={a.x} cy={a.y} r="14" fill="none" stroke="rgba(94,234,212,0.4)" />
            <rect
              x={a.x - 18}
              y={a.y - 36}
              width="36"
              height="20"
              rx="6"
              fill="rgba(2,6,14,0.9)"
              stroke="rgba(94,234,212,0.5)"
            />
            <text
              x={a.x}
              y={a.y - 22}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="rgba(94,234,212,1)"
            >
              {a.l}
            </text>
          </g>
        ))}

        {/* Liquidity zone */}
        <rect x="0" y="120" width="800" height="20" fill="rgba(232,121,249,0.08)" />
        <line
          x1="0"
          y1="130"
          x2="800"
          y2="130"
          stroke="rgba(232,121,249,0.6)"
          strokeDasharray="6 4"
        />
        <text x="14" y="115" fontSize="11" fontWeight="700" fill="rgba(232,121,249,0.9)">
          LIQUIDITY POOL
        </text>

        {/* Trend break label */}
        <g transform="translate(440, 380)">
          <rect width="170" height="34" rx="8" fill="rgba(2,6,14,0.92)" stroke="rgba(94,234,212,0.5)" />
          <text x="14" y="22" fontSize="12" fontWeight="700" fill="rgba(94,234,212,0.95)">
            STRUCTURE BREAK · BULL
          </text>
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// SECTION 2 · Live Market Scanner
// ============================================================

const SCANNER_DATA = [
  { symbol: "BTCUSDT", bias: "long" as const, confidence: 87, price: 47234.21, change: 2.4 },
  { symbol: "ETHUSDT", bias: "long" as const, confidence: 82, price: 2845.13, change: 3.1 },
  { symbol: "SOLUSDT", bias: "short" as const, confidence: 76, price: 98.45, change: -1.8 },
  { symbol: "BNBUSDT", bias: "long" as const, confidence: 74, price: 312.5, change: 1.2 },
  { symbol: "AVAXUSDT", bias: "long" as const, confidence: 68, price: 38.91, change: 4.3 },
  { symbol: "ADAUSDT", bias: "wait" as const, confidence: 45, price: 0.485, change: 0.3 },
];

export function ScannerSection() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <Reveal variant="up">
          <div className="text-center mx-auto max-w-3xl space-y-4">
            <span className="vx-cine-eyebrow mx-auto">02 · Live scanner</span>
            <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)" }}>
              <Kinetic
                text="Every market. Ranked in real time."
                highlightRange={[2, 2]}
              />
            </h2>
            <p className="vx-cine-sub mx-auto" style={{ textAlign: "center" }}>
              Binance-backed WebSocket feeds rank opportunities by momentum,
              volume, and structural quality — every second.
            </p>
          </div>
        </Reveal>

        <Reveal variant="up" delay={150}>
          <div className="vx-cine-glass mt-12 p-4 sm:p-6">
            <Stagger className="vx-cine-scanner">
              {SCANNER_DATA.map((row, i) => (
                <ScannerRow key={row.symbol} {...row} delay={`${i * 0.4}s`} />
              ))}
            </Stagger>

            <div className="mt-6 flex justify-center">
              <MagneticButton variant="ghost" href="/terminal">
                See the live terminal
                <span className="vx-cine-btn-icon">
                  <ChevronRight className="h-4 w-4" />
                </span>
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function ScannerRow({
  symbol,
  bias,
  confidence,
  price,
  change,
  delay,
}: {
  symbol: string;
  bias: "long" | "short" | "wait";
  confidence: number;
  price: number;
  change: number;
  delay: string;
}) {
  const dotColor =
    bias === "long"
      ? "rgb(52, 211, 153)"
      : bias === "short"
        ? "rgb(251, 113, 133)"
        : "rgb(251, 191, 36)";

  return (
    <div
      className="vx-cine-scanner-row"
      style={{
        ["--row-d" as string]: delay,
        ["--dot-color" as string]: dotColor,
      } as React.CSSProperties}
    >
      <div className="vx-cine-scanner-symbol">
        {symbol.replace(/USDT$/i, "")}
        <span className="text-xs text-white/40 font-normal ml-1">/USDT</span>
      </div>
      <div className={`vx-cine-scanner-bias ${bias}`}>{bias}</div>
      <div className="vx-cine-scanner-bar">
        <div
          className="vx-cine-scanner-bar-fill"
          style={{ ["--w" as string]: `${confidence}%` } as React.CSSProperties}
        />
      </div>
      <div className="vx-cine-scanner-price">
        ${price < 1 ? price.toFixed(4) : price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </div>
      <div
        className={`vx-cine-scanner-change ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}
        style={{ textAlign: "right" }}
      >
        {change >= 0 ? "+" : ""}
        {change.toFixed(2)}%
      </div>
    </div>
  );
}

// ============================================================
// SECTION 3 · TP/SL Risk Pathing
// ============================================================

export function RiskPathSection() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] items-center">
          <Reveal variant="left">
            <Tilt3D max={5} className="vx-cine-tilt-bare">
              <div className="vx-cine-glass vx-cine-holo p-5">
                <RiskViz />
              </div>
            </Tilt3D>
          </Reveal>

          <Reveal variant="right">
            <div className="space-y-6 max-w-xl">
              <span className="vx-cine-eyebrow">03 · Risk pathing</span>
              <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2rem,5vw,4.4rem)" }}>
                <Kinetic
                  text="Entries. Stops. Targets."
                />
                <br />
                <Kinetic text="Mapped. Not guessed." highlightRange={[0, 0]} />
              </h2>
              <p className="vx-cine-sub">
                Every signal ships with structural entry zones, an
                invalidation level, and three staged take-profits — backed
                by R:R math, not hope.
              </p>
              <Stagger className="grid grid-cols-2 gap-3">
                <RiskPill icon={<Target className="h-4 w-4" />} label="Entry zone" value="$46,800–47,200" />
                <RiskPill icon={<Activity className="h-4 w-4" />} label="Invalidation" value="$46,200" tone="rose" />
                <RiskPill icon={<TrendingUp className="h-4 w-4" />} label="TP1 / 40%" value="$48,500" tone="emerald" />
                <RiskPill icon={<Zap className="h-4 w-4" />} label="R : R" value="1 : 3.2" tone="cyan" />
              </Stagger>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function RiskPill({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "default" | "emerald" | "rose" | "cyan";
}) {
  const toneCls =
    tone === "emerald"
      ? "text-emerald-300"
      : tone === "rose"
        ? "text-rose-300"
        : tone === "cyan"
          ? "text-cyan-300"
          : "text-white";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 backdrop-blur-md">
      <div className={cn("flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55", toneCls)}>
        {icon}
        {label}
      </div>
      <div className={cn("mt-2 text-lg font-semibold tabular-nums", toneCls)}>{value}</div>
    </div>
  );
}

function RiskViz() {
  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
      <svg viewBox="0 0 800 500" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id="vxRiskGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(167,139,250,0.4)" />
            <stop offset="100%" stopColor="rgba(167,139,250,0)" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <line key={i} x1="0" y1={i * 60 + 30} x2="800" y2={i * 60 + 30} stroke="rgba(255,255,255,0.035)" />
        ))}

        {/* Candles */}
        {Array.from({ length: 30 }).map((_, i) => {
          const seed = (i * 9301 + 49297) % 233280;
          const r = seed / 233280;
          const x = i * 22 + 20;
          const base = 280 + Math.sin(i / 3) * 30;
          const op = base + (r - 0.5) * 30;
          const cp = op + (r - 0.4) * 25 - i * 1.2;
          const hi = Math.min(op, cp) - 8 - r * 18;
          const lo = Math.max(op, cp) + 8 + r * 18;
          const up = cp < op;
          return (
            <g key={i}>
              <line x1={x} y1={hi} x2={x} y2={lo} stroke={up ? "rgba(110,231,183,0.6)" : "rgba(252,165,165,0.6)"} />
              <rect
                x={x - 5}
                y={Math.min(op, cp)}
                width="10"
                height={Math.max(2, Math.abs(cp - op))}
                fill={up ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)"}
              />
            </g>
          );
        })}

        {/* Entry zone */}
        <rect x="0" y="270" width="800" height="34" fill="rgba(167,139,250,0.12)" />
        <line x1="0" y1="287" x2="800" y2="287" stroke="rgba(167,139,250,0.85)" strokeDasharray="6 4" strokeWidth="1.5" />
        <text x="14" y="263" fontSize="11" fontWeight="700" fill="rgba(167,139,250,0.95)">ENTRY ZONE</text>

        {/* Stop loss */}
        <line x1="0" y1="380" x2="800" y2="380" stroke="rgba(251,113,133,0.85)" strokeDasharray="8 5" strokeWidth="1.5" />
        <rect x="700" y="368" width="86" height="22" rx="5" fill="rgba(2,6,14,0.92)" stroke="rgba(251,113,133,0.7)" />
        <text x="743" y="383" textAnchor="middle" fontSize="11" fontWeight="700" fill="rgba(251,113,133,0.95)">SL · 46,200</text>

        {/* TPs */}
        {[
          { y: 200, l: "TP1 · 48,500", c: "rgba(52,211,153,0.95)", o: 1 },
          { y: 140, l: "TP2 · 49,200", c: "rgba(52,211,153,0.85)", o: 0.85 },
          { y: 80, l: "TP3 · 50,400", c: "rgba(52,211,153,0.75)", o: 0.7 }
        ].map((tp) => (
          <g key={tp.l}>
            <line x1="0" y1={tp.y} x2="800" y2={tp.y} stroke={tp.c} strokeDasharray="8 5" strokeWidth="1.5" />
            <rect x="700" y={tp.y - 12} width="86" height="22" rx="5" fill="rgba(2,6,14,0.92)" stroke={tp.c} opacity={tp.o} />
            <text x="743" y={tp.y + 3} textAnchor="middle" fontSize="11" fontWeight="700" fill={tp.c}>{tp.l}</text>
          </g>
        ))}

        {/* Path arrow from entry to TP1 */}
        <path d="M 660 290 C 700 270, 740 250, 690 210" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="2" strokeDasharray="4 3" />
        <circle cx="690" cy="210" r="5" fill="rgba(167,139,250,0.95)" />
      </svg>
    </div>
  );
}

// ============================================================
// SECTION 4 · Telegram Lifecycle
// ============================================================

const STAGES = [
  { num: "01", icon: ScanLine, title: "Signal generated", body: "AI detects setup, runs multi-timeframe gate." },
  { num: "02", icon: Layers, title: "Entry confirmed", body: "Structure + momentum align — alert fires." },
  { num: "03", icon: Target, title: "TP1 hit", body: "40% closed, stop slid to break-even." },
  { num: "04", icon: Send, title: "Final exit", body: "TP3 reached or invalidation broadcast live." },
];

export function LifecycleSection() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="vx-cine-eyebrow mx-auto">04 · Telegram lifecycle</span>
            <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2rem,5vw,4.4rem)" }}>
              <Kinetic
                text="From setup to exit, broadcast live."
                highlightRange={[3, 3]}
              />
            </h2>
            <p className="vx-cine-sub mx-auto" style={{ textAlign: "center" }}>
              Every signal carries its own lifecycle. Entry confirmation,
              TP hits, stop adjustments, invalidations — pushed in
              real time to your Telegram.
            </p>
          </div>
        </Reveal>

        <Reveal variant="up" delay={150}>
          <Stagger className="vx-cine-stage-grid mt-14">
            {STAGES.map((s) => {
              const Icon = s.icon;
              return (
                <Tilt3D key={s.num} max={5} className="vx-cine-tilt-bare">
                  <article className="vx-cine-stage">
                    <div className="vx-cine-stage-num">{s.num}</div>
                    <div className="vx-cine-stage-icon">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="vx-cine-stage-title">{s.title}</h3>
                    <p className="vx-cine-stage-body">{s.body}</p>
                  </article>
                </Tilt3D>
              );
            })}
          </Stagger>
        </Reveal>
      </div>
    </section>
  );
}

// ============================================================
// SECTION 5 · Multi-Timeframe Confirmation Rings
// ============================================================

export function ConfirmationSection() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="vx-cine-eyebrow mx-auto">05 · Confirmation engine</span>
            <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2rem,5vw,4.4rem)" }}>
              <Kinetic
                text="Three timeframes. One alignment."
                highlightRange={[2, 2]}
              />
            </h2>
            <p className="vx-cine-sub mx-auto" style={{ textAlign: "center" }}>
              15m for entry precision. 1H for momentum confirmation.
              4H for trend integrity. All three must align before
              a signal fires.
            </p>
          </div>
        </Reveal>

        <Reveal variant="up" delay={150}>
          <Stagger className="vx-cine-rings mt-14">
            <Ring label="15m · Entry" value={92} />
            <Ring label="1H · Momentum" value={85} />
            <Ring label="4H · Trend" value={78} />
            <Ring label="Combined" value={88} featured />
          </Stagger>
        </Reveal>
      </div>
    </section>
  );
}

function Ring({ label, value, featured }: { label: string; value: number; featured?: boolean }) {
  return (
    <article className={cn("vx-cine-ring", featured && "featured")}>
      <div
        className="vx-cine-ring-disc"
        style={{ ["--p" as string]: value } as React.CSSProperties}
      >
        <strong>{value}%</strong>
      </div>
      <div className="vx-cine-ring-label">{label}</div>
    </article>
  );
}

// ============================================================
// SECTION 6 · Institutional Risk Engine
// ============================================================

export function RiskEngineSection() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <Reveal variant="up">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <span className="vx-cine-eyebrow mx-auto">06 · Risk engine</span>
            <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2rem,5vw,4.4rem)" }}>
              <Kinetic
                text="Institutional risk. Built in."
                highlightRange={[1, 1]}
              />
            </h2>
            <p className="vx-cine-sub mx-auto" style={{ textAlign: "center" }}>
              Position sizing, portfolio heat, drawdown limits, and
              correlation analysis — wired into every signal before
              you click.
            </p>
          </div>
        </Reveal>

        <Reveal variant="up" delay={150}>
          <Stagger className="vx-cine-risk mt-14">
            <RiskCard
              icon={<ShieldCheck className="h-5 w-5 text-cyan-300" />}
              label="Position size"
              value="2.5%"
              meta="of equity per signal"
              glow="rgba(94,234,212,0.22)"
            />
            <RiskCard
              icon={<Activity className="h-5 w-5 text-amber-300" />}
              label="Portfolio heat"
              value="8.2%"
              meta="active across positions"
              glow="rgba(251,191,36,0.22)"
            />
            <RiskCard
              icon={<Telescope className="h-5 w-5 text-emerald-300" />}
              label="Win rate · 30d"
              value="68%"
              meta="across closed signals"
              glow="rgba(52,211,153,0.22)"
            />
          </Stagger>
        </Reveal>
      </div>
    </section>
  );
}

function RiskCard({
  icon,
  label,
  value,
  meta,
  glow,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  meta: string;
  glow: string;
}) {
  return (
    <Tilt3D max={5} className="vx-cine-tilt-bare">
      <article
        className="vx-cine-risk-card"
        style={{ ["--risk-glow" as string]: glow } as React.CSSProperties}
      >
        <div className="vx-cine-risk-icon">{icon}</div>
        <div className="vx-cine-risk-label">{label}</div>
        <div className="vx-cine-risk-value">{value}</div>
        <div className="vx-cine-risk-meta">{meta}</div>
      </article>
    </Tilt3D>
  );
}

// ============================================================
// SECTION 7 · Footer / CTA Band
// ============================================================

export function ClosingCTA() {
  return (
    <section className="vx-cine-section">
      <div className="vx-cine-container">
        <Reveal variant="up">
          <div className="vx-cine-footer">
            <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] items-end">
              <div className="space-y-5">
                <span className="vx-cine-eyebrow">Final call</span>
                <h2 className="vx-cine-headline" style={{ fontSize: "clamp(2rem,5vw,4.6rem)" }}>
                  <Kinetic
                    text="Step inside the terminal."
                    highlightRange={[2, 2]}
                  />
                </h2>
                <p className="vx-cine-sub">
                  Probability-based. Risk-framed. Cinematic. Not financial advice — disciplined operators only.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <MagneticButton variant="primary" href="/terminal" strength={20}>
                  Launch terminal
                  <span className="vx-cine-btn-icon">
                    <ArrowRightSimple />
                  </span>
                </MagneticButton>
                <MagneticButton variant="ghost" href="/pricing">
                  See pricing
                </MagneticButton>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-white/40">
              <span>© Vypexrock · Cinematic market intelligence</span>
              <div className="flex items-center gap-4">
                <Link href="/about-crypto" className="hover:text-white/70 transition">About</Link>
                <Link href="/pricing" className="hover:text-white/70 transition">Pricing</Link>
                <Link href="/community" className="hover:text-white/70 transition">Community</Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Reusable: simple feature row
function FeatureRow({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-cyan-300">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-white">{title}</p>
        <p className="mt-1 text-sm text-white/55 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function ArrowRightSimple() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
      <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
