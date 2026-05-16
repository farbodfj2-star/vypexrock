"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, BarChart3, BrainCircuit, Eye, Layers3, Radio, ScanLine, Target, TrendingUp, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function AISeesStructure() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative overflow-hidden px-6 py-24 sm:px-10 lg:px-14">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">AI Vision</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              AI sees structure
              <br />
              <span className="text-white/50">before noise.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              While others chase candles, our AI identifies liquidity zones, structural breaks, and momentum shifts across multiple timeframes — before the crowd reacts.
            </p>
            
            <div className="mt-8 space-y-4">
              <Feature icon={Eye} label="Pattern recognition" desc="Detects support/resistance, channels, and breakout setups" />
              <Feature icon={Layers3} label="Multi-timeframe sync" desc="15m entry, 1H confirmation, 4H trend alignment" />
              <Feature icon={BrainCircuit} label="Explainable AI" desc="Every signal shows reasoning, not black-box scores" />
            </div>
          </div>

          <div className="relative">
            <div className={cn(
              "cinema-hero-terminal p-6 transition-all duration-1000",
              isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
            )}>
              <StructureVisualization isVisible={isVisible} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveMarketScanner() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const signals = [
    { symbol: "BTCUSDT", bias: "LONG", confidence: 87, price: "$47,234", change: "+2.4%", up: true },
    { symbol: "ETHUSDT", bias: "LONG", confidence: 82, price: "$2,845", change: "+3.1%", up: true },
    { symbol: "SOLUSDT", bias: "SHORT", confidence: 76, price: "$98.45", change: "-1.8%", up: false },
    { symbol: "BNBUSDT", bias: "LONG", confidence: 74, price: "$312.50", change: "+1.2%", up: true },
    { symbol: "ADAUSDT", bias: "WAIT", confidence: 45, price: "$0.485", change: "+0.3%", up: true },
  ];

  return (
    <section ref={ref} className="relative px-6 py-24 sm:px-10 lg:px-14">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Real-time Intelligence</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Live market scanner
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Binance-backed WebSocket feeds rank opportunities by momentum, volume, and structural quality — updated every second.
          </p>
        </div>

        <div className={cn(
          "mt-12 space-y-3 transition-all duration-1000 delay-200",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
        )}>
          {signals.map((signal, i) => (
            <div
              key={signal.symbol}
              className="cinema-signal-row"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  signal.up ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" : "bg-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                )} />
                <div>
                  <strong className="text-white">{signal.symbol}</strong>
                  <span className="ml-3 text-sm text-white/50">{signal.price}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <span className={cn(
                  "text-xs font-bold uppercase tracking-wider",
                  signal.bias === "LONG" ? "text-emerald-400" : signal.bias === "SHORT" ? "text-rose-400" : "text-amber-300"
                )}>
                  {signal.bias}
                </span>
                <span className="font-mono text-sm text-cyan-300">{signal.confidence}%</span>
                <span className={cn("text-sm font-semibold", signal.up ? "text-emerald-400" : "text-rose-400")}>
                  {signal.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ChartAnalysisSection() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative px-6 py-24 sm:px-10 lg:px-14">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className={cn(
            "relative transition-all duration-1000",
            isVisible ? "translate-x-0 opacity-100" : "-translate-x-12 opacity-0"
          )}>
            <div className="cinema-hero-terminal p-6">
              <ChartWithLevels isVisible={isVisible} />
            </div>
          </div>

          <div className={cn(
            "transition-all duration-1000 delay-300",
            isVisible ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
          )}>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Risk Framework</p>
            <h2 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
              Chart analysis with
              <br />
              <span className="text-white/50">TP/SL precision.</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white/60">
              Upload any chart. Get entry zones, stop loss, and staged take-profits with R:R calculations — not vague "buy here" arrows.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <MetricCard icon={Target} label="Entry Zone" value="$46,800 - $47,200" />
              <MetricCard icon={Activity} label="Stop Loss" value="$46,200" color="rose" />
              <MetricCard icon={TrendingUp} label="TP1 (40%)" value="$48,500" color="emerald" />
              <MetricCard icon={Zap} label="R:R Ratio" value="1:3.2" color="cyan" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TelegramSignalLifecycle() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const stages = [
    { label: "Signal Generated", desc: "AI detects setup", icon: ScanLine, delay: 0 },
    { label: "Entry Confirmed", desc: "Multi-TF alignment", icon: Layers3, delay: 200 },
    { label: "TP1 Hit", desc: "40% position closed", icon: Target, delay: 400 },
    { label: "Final Update", desc: "TP3 or invalidation", icon: Radio, delay: 600 },
  ];

  return (
    <section ref={ref} className="relative px-6 py-24 sm:px-10 lg:px-14">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Signal Lifecycle</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            From setup to exit,
            <br />
            <span className="text-white/50">tracked in Telegram.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Every signal gets real-time updates: entry confirmation, TP hits, stop adjustments, and invalidation alerts — pushed directly to your Telegram.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.label}
                className={cn(
                  "cinema-workflow-orb transition-all duration-700",
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
                )}
                style={{ transitionDelay: `${stage.delay}ms` }}
              >
                <span className="flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-8">{stage.label}</h3>
                <p>{stage.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function MultiTimeframeConfirmation() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative px-6 py-24 sm:px-10 lg:px-14">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Timeframe Hierarchy</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Multi-timeframe
            <br />
            <span className="text-white/50">confirmation engine.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            15m for entry precision. 1H for momentum confirmation. 4H for trend direction. All three must align before a signal fires.
          </p>
        </div>

        <div className={cn(
          "confidence-orbit-stage mt-12 transition-all duration-1000",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}>
          <ConfidenceRing label="15m Entry" value={92} delay={0} isVisible={isVisible} />
          <ConfidenceRing label="1H Momentum" value={85} delay={200} isVisible={isVisible} />
          <ConfidenceRing label="4H Trend" value={78} delay={400} isVisible={isVisible} />
          <ConfidenceRing label="Combined" value={88} delay={600} isVisible={isVisible} highlight />
        </div>
      </div>
    </section>
  );
}

export function InstitutionalRiskEngine() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="relative px-6 py-24 sm:px-10 lg:px-14">
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300/70">Risk Management</p>
          <h2 className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Institutional risk engine
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
            Position sizing, portfolio heat, correlation analysis, and drawdown limits — built into every signal before you click.
          </p>
        </div>

        <div className={cn(
          "mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 transition-all duration-1000",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
        )}>
          <RiskCard icon={BarChart3} label="Position Sizing" value="2.5% per trade" />
          <RiskCard icon={Activity} label="Portfolio Heat" value="8.2% active" color="amber" />
          <RiskCard icon={Target} label="Win Rate" value="68% (30d)" color="emerald" />
        </div>
      </div>
    </section>
  );
}

// Helper Components

function Feature({ icon: Icon, label, desc }: { icon: LucideIcon; label: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10">
        <Icon className="h-5 w-5 text-cyan-300" />
      </div>
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm text-white/55">{desc}</p>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color = "white" }: { icon: LucideIcon; label: string; value: string; color?: "white" | "emerald" | "rose" | "cyan" }) {
  const colorClass = color === "emerald" ? "text-emerald-300" : color === "rose" ? "text-rose-300" : color === "cyan" ? "text-cyan-300" : "text-white";
  
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
      <Icon className={cn("h-5 w-5", colorClass)} />
      <p className="mt-3 text-xs uppercase tracking-wider text-white/50">{label}</p>
      <p className={cn("mt-1 text-lg font-bold", colorClass)}>{value}</p>
    </div>
  );
}

function RiskCard({ icon: Icon, label, value, color = "white" }: { icon: LucideIcon; label: string; value: string; color?: "white" | "emerald" | "amber" }) {
  const colorClass = color === "emerald" ? "text-emerald-300" : color === "amber" ? "text-amber-300" : "text-white";
  
  return (
    <div className="cinema-metric-card">
      <Icon className={cn("h-6 w-6", colorClass)} />
      <p className="mt-4 text-sm uppercase tracking-wider text-white/50">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold", colorClass)}>{value}</p>
    </div>
  );
}

function ConfidenceRing({ label, value, delay, isVisible, highlight = false }: { label: string; value: number; delay: number; isVisible: boolean; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "confidence-ring-card transition-all duration-700",
        isVisible ? "scale-100 opacity-100" : "scale-90 opacity-0",
        highlight && "ring-2 ring-cyan-400/30"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div>
        <div className="confidence-ring" style={{ "--value": value } as React.CSSProperties}>
          <strong>{value}%</strong>
        </div>
        <span className="mt-4 block">{label}</span>
      </div>
    </div>
  );
}

function StructureVisualization({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="relative h-64 overflow-hidden rounded-xl bg-black/40">
      <svg viewBox="0 0 400 200" className="h-full w-full">
        {/* Grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
        ))}
        
        {/* Price action line */}
        <path
          d="M 0 150 Q 50 140, 100 120 T 200 100 T 300 80 T 400 60"
          fill="none"
          stroke="rgba(52,211,153,0.6)"
          strokeWidth="2"
          className={cn("transition-all duration-1000", isVisible ? "opacity-100" : "opacity-0")}
        />
        
        {/* Support level */}
        <line
          x1="0"
          y1="160"
          x2="400"
          y2="160"
          stroke="rgba(244,63,94,0.5)"
          strokeWidth="2"
          strokeDasharray="8 4"
          className={cn("transition-all duration-1000 delay-300", isVisible ? "opacity-100" : "opacity-0")}
        />
        
        {/* Resistance level */}
        <line
          x1="0"
          y1="70"
          x2="400"
          y2="70"
          stroke="rgba(52,211,153,0.5)"
          strokeWidth="2"
          strokeDasharray="8 4"
          className={cn("transition-all duration-1000 delay-500", isVisible ? "opacity-100" : "opacity-0")}
        />
      </svg>
      
      <div className={cn(
        "absolute left-4 top-4 rounded-lg border border-cyan-400/30 bg-black/70 px-3 py-2 text-xs font-bold text-cyan-300 backdrop-blur-sm transition-all duration-700 delay-700",
        isVisible ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
      )}>
        Structure Break Detected
      </div>
    </div>
  );
}

function ChartWithLevels({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="relative h-80 overflow-hidden rounded-xl bg-black/40">
      <svg viewBox="0 0 400 300" className="h-full w-full">
        {/* Grid */}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={i} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
        ))}
        
        {/* Candlesticks */}
        {Array.from({ length: 30 }).map((_, i) => {
          const x = i * 13 + 10;
          const isUp = Math.random() > 0.5;
          const open = 150 + Math.sin(i / 3) * 40;
          const close = open + (Math.random() - 0.5) * 30;
          const high = Math.max(open, close) + Math.random() * 15;
          const low = Math.min(open, close) - Math.random() * 15;
          
          return (
            <g key={i} className={cn("transition-all duration-500", isVisible ? "opacity-100" : "opacity-0")} style={{ transitionDelay: `${i * 20}ms` }}>
              <line x1={x} y1={high} x2={x} y2={low} stroke={isUp ? "rgba(110,231,183,0.8)" : "rgba(252,165,165,0.8)"} strokeWidth="1" />
              <rect
                x={x - 3}
                y={Math.min(open, close)}
                width="6"
                height={Math.max(2, Math.abs(close - open))}
                fill={isUp ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)"}
              />
            </g>
          );
        })}
        
        {/* Entry zone */}
        <rect
          x="0"
          y="140"
          width="400"
          height="20"
          fill="rgba(167,139,250,0.15)"
          className={cn("transition-all duration-700 delay-500", isVisible ? "opacity-100" : "opacity-0")}
        />
        <line x1="0" y1="150" x2="400" y2="150" stroke="rgba(167,139,250,0.7)" strokeWidth="2" className={cn("transition-all duration-700 delay-500", isVisible ? "opacity-100" : "opacity-0")} />
        
        {/* Stop loss */}
        <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(244,63,94,0.7)" strokeWidth="2" strokeDasharray="8 4" className={cn("transition-all duration-700 delay-700", isVisible ? "opacity-100" : "opacity-0")} />
        
        {/* Take profits */}
        <line x1="0" y1="100" x2="400" y2="100" stroke="rgba(52,211,153,0.6)" strokeWidth="2" strokeDasharray="8 4" className={cn("transition-all duration-700 delay-900", isVisible ? "opacity-100" : "opacity-0")} />
        <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(52,211,153,0.5)" strokeWidth="2" strokeDasharray="8 4" className={cn("transition-all duration-700 delay-1000", isVisible ? "opacity-100" : "opacity-0")} />
        <line x1="0" y1="40" x2="400" y2="40" stroke="rgba(52,211,153,0.4)" strokeWidth="2" strokeDasharray="8 4" className={cn("transition-all duration-700 delay-1100", isVisible ? "opacity-100" : "opacity-0")} />
      </svg>
      
      {/* Labels */}
      <div className={cn("absolute right-4 top-8 text-xs font-bold text-emerald-300 transition-all duration-700 delay-1100", isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0")}>TP3</div>
      <div className={cn("absolute right-4 top-16 text-xs font-bold text-emerald-300 transition-all duration-700 delay-1000", isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0")}>TP2</div>
      <div className={cn("absolute right-4 top-24 text-xs font-bold text-emerald-300 transition-all duration-700 delay-900", isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0")}>TP1</div>
      <div className={cn("absolute right-4 top-36 text-xs font-bold text-purple-300 transition-all duration-700 delay-500", isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0")}>ENTRY</div>
      <div className={cn("absolute right-4 bottom-24 text-xs font-bold text-rose-300 transition-all duration-700 delay-700", isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0")}>STOP LOSS</div>
    </div>
  );
}
