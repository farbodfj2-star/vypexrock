"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { Kinetic, Reveal } from "@/components/vx/cine-reveal";
import { HolographicChart } from "@/components/vx/holographic-chart";
import { MagneticButton, Tilt3D } from "@/components/vx/magnetic";
import { WebglAtmosphere } from "@/components/vx/webgl-atmosphere";
import type { MarketSignalScore } from "@/lib/market-signals";
import { formatCompactNumber, formatCurrency } from "@/lib/utils";
import type { MarketTicker } from "@/types";

type Props = {
  rows: MarketTicker[];
  topSignal?: MarketSignalScore & { symbol: string; price: number };
  totalVolume: number;
  advancing: number;
};

export function CinematicHero({ rows, topSignal, totalVolume, advancing }: Props) {
  const heroRef = useRef<HTMLDivElement>(null);

  // Scroll-driven CSS variable for the entire hero
  useEffect(() => {
    const node = heroRef.current;
    if (!node) return;
    let raf = 0;
    const update = () => {
      const rect = node.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const p = Math.max(0, Math.min(1, (window.innerHeight - rect.top) / total));
      node.style.setProperty("--hero-p", p.toFixed(3));
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const featured = rows[0];
  const breadthPct = rows.length ? Math.round((advancing / rows.length) * 100) : 0;

  return (
    <section
      ref={heroRef}
      className="vx-cine-hero"
      style={{
        // Parallax outputs from scroll progress
        // The shader and grid float gently as the user scrolls
        transform: "translate3d(0,0,0)",
      }}
    >
      <WebglAtmosphere className="vx-cine-hero-canvas" />
      <div className="vx-cine-hero-grid" />
      <div className="vx-cine-hero-floor" />
      <div className="vx-cine-hero-vignette" />

      <div className="vx-cine-hero-stage">
        {/* Left: Cinematic copy block */}
        <div className="vx-cine-hero-copy">
          <Reveal variant="up">
            <span className="vx-cine-eyebrow">
              Vypexrock · Live institutional intelligence
            </span>
          </Reveal>

          <h1 className="vx-cine-headline">
            <Kinetic text="Trade with cinematic" />
            <br />
            <Kinetic
              text="precision. Not noise."
              highlightRange={[0, 0]}
            />
          </h1>

          <Reveal variant="up" delay={250}>
            <p className="vx-cine-sub">
              Multi-timeframe structure, live Binance data, and AI-pathed
              risk framing — fused into a single cinematic terminal built
              for serious operators. Your edge, projected before the crowd
              reacts.
            </p>
          </Reveal>

          <Reveal variant="up" delay={400}>
            <div className="flex flex-wrap items-center gap-3">
              <MagneticButton variant="primary" href="/terminal" strength={18}>
                Enter the terminal
                <span className="vx-cine-btn-icon">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </MagneticButton>
              <MagneticButton variant="ghost" href="/chart-analyzer" strength={14}>
                <Sparkles className="h-4 w-4" />
                Analyze a chart
              </MagneticButton>
            </div>
          </Reveal>

          <Reveal variant="up" delay={600}>
            <dl className="vx-cine-hero-stats">
              <div>
                <dt className="vx-cine-hero-stat-label">Universe</dt>
                <dd className="vx-cine-hero-stat-value">{rows.length || "—"}</dd>
              </div>
              <div>
                <dt className="vx-cine-hero-stat-label">24h Volume</dt>
                <dd className="vx-cine-hero-stat-value">{formatCompactNumber(totalVolume)}</dd>
              </div>
              <div>
                <dt className="vx-cine-hero-stat-label">Breadth</dt>
                <dd
                  className={`vx-cine-hero-stat-value ${
                    breadthPct >= 50 ? "vx-cine-hero-stat-up" : "vx-cine-hero-stat-dn"
                  }`}
                >
                  {breadthPct}%
                </dd>
              </div>
            </dl>
          </Reveal>
        </div>

        {/* Right: Cinematic terminal with holographic chart */}
        <Reveal variant="fade" delay={200}>
          <Tilt3D max={5} className="vx-cine-tilt-bare">
            <div className="vx-cine-terminal">
              <div className="vx-cine-terminal-chrome">
                <span className="vx-cine-dots">
                  <span /> <span /> <span />
                </span>
                <span>
                  {featured?.symbol ?? "BTCUSDT"} · 15m · live structure
                </span>
              </div>

              <div className="vx-cine-terminal-body">
                <div className="vx-cine-terminal-canvas">
                  <HolographicChart />
                  <div className="vx-cine-terminal-scanlines" />
                  <div className="vx-cine-terminal-scan-beam" />

                  {topSignal ? (
                    <div className="vx-cine-terminal-meter">
                      <div className="vx-cine-terminal-meter-label">AI Confidence</div>
                      <div className="vx-cine-terminal-meter-value">
                        {topSignal.confidence}%
                      </div>
                      <div
                        className={`text-xs font-semibold uppercase tracking-wider mt-1 ${
                          topSignal.direction === "long"
                            ? "text-emerald-300"
                            : topSignal.direction === "short"
                              ? "text-rose-300"
                              : "text-amber-300"
                        }`}
                      >
                        {topSignal.decision}
                      </div>
                    </div>
                  ) : null}
                </div>

                {topSignal ? (
                  <div className="vx-cine-terminal-stats">
                    <div className="vx-cine-terminal-stat">
                      <div className="vx-cine-terminal-stat-label">Bias</div>
                      <div
                        className={`vx-cine-terminal-stat-value ${
                          topSignal.direction === "long"
                            ? "up"
                            : topSignal.direction === "short"
                              ? "dn"
                              : "neut"
                        }`}
                      >
                        {topSignal.decision}
                      </div>
                    </div>
                    <div className="vx-cine-terminal-stat">
                      <div className="vx-cine-terminal-stat-label">R : R</div>
                      <div className="vx-cine-terminal-stat-value">
                        {topSignal.riskReward}
                      </div>
                    </div>
                    <div className="vx-cine-terminal-stat">
                      <div className="vx-cine-terminal-stat-label">Entry</div>
                      <div className="vx-cine-terminal-stat-value">
                        {formatCurrency(topSignal.price)}
                      </div>
                    </div>
                    <div className="vx-cine-terminal-stat">
                      <div className="vx-cine-terminal-stat-label">Frame</div>
                      <div className="vx-cine-terminal-stat-value">15m / 1H / 4H</div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Floating holo notifications */}
              <div className="vx-cine-floater vx-cine-floater-1">
                Liquidity sweep · 41,820
              </div>
              <div className="vx-cine-floater vx-cine-floater-2">
                Structure break · BUY
              </div>
              <div className="vx-cine-floater vx-cine-floater-3">
                Volume spike · 2.4× avg
              </div>
            </div>
          </Tilt3D>
        </Reveal>
      </div>
    </section>
  );
}
