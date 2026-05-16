"use client";

import { useEffect, useRef } from "react";

/**
 * CinematicLambo — the dramatic act.
 *
 *   • Sticky scene tied to scroll inside its own section.
 *   • Coins (BTC, ETH, SOL, PEPE, DOGE, XAU) float past in parallax.
 *   • A dark Lamborghini-silhouette emerges from the left,
 *     drives across the frame as scroll progresses.
 *   • Slow "for this....." typing appears at the bottom.
 *   • Headlight flares bloom + scan beams sweep right→left.
 */
export function CinematicLambo() {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const phraseRef = useRef<HTMLSpanElement>(null);
  const typingFiredRef = useRef(false);

  // Drive --p (0–1) for this section
  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    let raf = 0;
    const update = () => {
      const rect = section.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const scrolled = window.innerHeight - rect.top;
      const p = Math.max(0, Math.min(1, scrolled / total));
      stage.style.setProperty("--lambo-p", p.toFixed(4));

      // Trigger slow typing once when in view
      if (!typingFiredRef.current && p > 0.18 && phraseRef.current) {
        typingFiredRef.current = true;
        runSlowTyping(phraseRef.current, "for this.....");
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section ref={sectionRef} className="cinematic-lambo">
      <div ref={stageRef} className="cinematic-lambo__stage">
        {/* ground reflection plane */}
        <div className="cinematic-lambo__ground" aria-hidden />

        {/* horizon scan beams */}
        <div className="cinematic-lambo__beam cinematic-lambo__beam--1" aria-hidden />
        <div className="cinematic-lambo__beam cinematic-lambo__beam--2" aria-hidden />

        {/* vertical city light streaks */}
        <div className="cinematic-lambo__streaks" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ "--i": i, "--n": 14 } as any} />
          ))}
        </div>

        {/* floating coins */}
        <CoinSprite symbol="BTC" className="coin coin--btc" />
        <CoinSprite symbol="ETH" className="coin coin--eth" />
        <CoinSprite symbol="SOL" className="coin coin--sol" />
        <CoinSprite symbol="PEPE" className="coin coin--pepe" />
        <CoinSprite symbol="DOGE" className="coin coin--doge" />
        <CoinSprite symbol="XAU" className="coin coin--xau" />

        {/* the car silhouette */}
        <div ref={carRef} className="cinematic-lambo__car" aria-hidden>
          <LamboSilhouette />
          <span className="cinematic-lambo__headlight cinematic-lambo__headlight--1" />
          <span className="cinematic-lambo__headlight cinematic-lambo__headlight--2" />
          <span className="cinematic-lambo__underglow" />
        </div>

        {/* foreground type */}
        <div className="cinematic-lambo__type">
          <p className="cinematic-lambo__kicker">CHAPTER 04 · WHY WE BUILT THIS</p>
          <h2 className="cinematic-lambo__title">
            Trade with discipline.
            <br />
            <em>Live without permission.</em>
          </h2>
          <p className="cinematic-lambo__phrase">
            <span ref={phraseRef} />
            <span className="cinematic-lambo__phrase-cursor" />
          </p>
        </div>

        {/* fixed corner HUD */}
        <div className="cinematic-lambo__hud" aria-hidden>
          <span className="cinematic-lambo__hud-dot" />
          <span>VYPEXROCK · CINEMATIC SCENE 04</span>
        </div>
      </div>
    </section>
  );
}

function CoinSprite({ symbol, className }: { symbol: string; className: string }) {
  return (
    <div className={"cinematic-lambo__coin " + className} aria-hidden>
      <div className="cinematic-lambo__coin-disc">
        <span>{symbol}</span>
      </div>
      <div className="cinematic-lambo__coin-glow" />
    </div>
  );
}

function LamboSilhouette() {
  // Stylized side-view supercar silhouette as inline SVG.
  // Pure shape, no external asset. Looks like a low-slung exotic.
  return (
    <svg
      className="cinematic-lambo__svg"
      viewBox="0 0 1100 320"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="vx-lambo-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0d1118" />
          <stop offset="0.4" stopColor="#1a2030" />
          <stop offset="1" stopColor="#06080d" />
        </linearGradient>
        <linearGradient id="vx-lambo-glass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(125, 211, 252, 0.55)" />
          <stop offset="1" stopColor="rgba(56, 189, 248, 0.05)" />
        </linearGradient>
        <linearGradient id="vx-lambo-edge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(125, 211, 252, 0)" />
          <stop offset="0.3" stopColor="rgba(125, 211, 252, 0.6)" />
          <stop offset="0.7" stopColor="rgba(125, 211, 252, 0.6)" />
          <stop offset="1" stopColor="rgba(125, 211, 252, 0)" />
        </linearGradient>
      </defs>

      {/* shadow under car */}
      <ellipse cx="550" cy="270" rx="430" ry="14" fill="#000" opacity="0.65" filter="blur(6px)" />

      {/* body main */}
      <path
        d="
          M 60 230
          L 130 230
          L 165 195
          L 245 175
          L 360 145
          L 480 110
          L 560 95
          C 660 92, 720 100, 800 130
          L 880 165
          L 1000 195
          L 1040 220
          L 1040 240
          L 980 260
          L 80 260
          Z
        "
        fill="url(#vx-lambo-body)"
        stroke="rgba(125, 211, 252, 0.18)"
        strokeWidth="0.8"
      />

      {/* hard top-edge highlight */}
      <path
        d="M 165 195 L 245 175 L 360 145 L 480 110 L 560 95 C 660 92, 720 100, 800 130 L 880 165"
        fill="none"
        stroke="url(#vx-lambo-edge)"
        strokeWidth="1.4"
      />

      {/* canopy / windscreen */}
      <path
        d="
          M 360 145
          L 480 110
          L 560 95
          C 640 96, 695 105, 740 124
          L 690 140
          L 580 145
          L 470 152
          L 380 155
          Z
        "
        fill="url(#vx-lambo-glass)"
        opacity="0.75"
      />
      <path
        d="M 360 145 L 480 110 L 560 95 C 640 96, 695 105, 740 124"
        fill="none"
        stroke="rgba(125, 211, 252, 0.5)"
        strokeWidth="0.6"
      />

      {/* side blade vent */}
      <path
        d="M 700 175 L 830 165 L 855 175 L 720 188 Z"
        fill="rgba(0, 0, 0, 0.6)"
        stroke="rgba(125, 211, 252, 0.2)"
        strokeWidth="0.4"
      />
      <line x1="720" y1="180" x2="845" y2="170" stroke="rgba(125, 211, 252, 0.3)" strokeWidth="0.4" />

      {/* lower side intake */}
      <path
        d="M 250 235 L 480 220 L 480 230 L 250 245 Z"
        fill="rgba(0, 0, 0, 0.55)"
        stroke="rgba(125, 211, 252, 0.18)"
        strokeWidth="0.4"
      />

      {/* front wheel */}
      <g transform="translate(220 250)">
        <circle r="42" fill="#04060a" stroke="rgba(125, 211, 252, 0.22)" strokeWidth="1" />
        <circle r="28" fill="#0a0d14" />
        <circle r="14" fill="#06080d" stroke="rgba(125, 211, 252, 0.3)" strokeWidth="0.5" />
        {/* wheel spokes — animated via CSS */}
        <g className="cinematic-lambo__wheel-spokes">
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x="-1.2"
              y="-26"
              width="2.4"
              height="22"
              fill="rgba(125, 211, 252, 0.3)"
              transform={`rotate(${i * 60})`}
            />
          ))}
        </g>
      </g>

      {/* rear wheel */}
      <g transform="translate(870 250)">
        <circle r="44" fill="#04060a" stroke="rgba(125, 211, 252, 0.22)" strokeWidth="1" />
        <circle r="30" fill="#0a0d14" />
        <circle r="14" fill="#06080d" stroke="rgba(125, 211, 252, 0.3)" strokeWidth="0.5" />
        <g className="cinematic-lambo__wheel-spokes">
          {Array.from({ length: 6 }).map((_, i) => (
            <rect
              key={i}
              x="-1.2"
              y="-28"
              width="2.4"
              height="24"
              fill="rgba(125, 211, 252, 0.3)"
              transform={`rotate(${i * 60})`}
            />
          ))}
        </g>
      </g>

      {/* headlight strip */}
      <path d="M 60 218 L 105 215 L 110 222 L 60 226 Z" fill="rgba(255, 255, 255, 0.85)" />
      <path d="M 60 218 L 105 215 L 110 222 L 60 226 Z" fill="rgba(125, 211, 252, 0.6)" opacity="0.5" />

      {/* tail signature */}
      <path d="M 1000 195 L 1040 220 L 1040 232 L 990 220 Z" fill="rgba(244, 63, 94, 0.55)" />
    </svg>
  );
}

function runSlowTyping(el: HTMLElement, text: string) {
  el.textContent = "";
  let i = 0;
  // slow, premium pace with occasional pause on '.'
  const tick = () => {
    if (i >= text.length) return;
    const ch = text.charAt(i);
    el.textContent += ch;
    i++;
    const delay = ch === "." ? 380 : 130;
    setTimeout(tick, delay);
  };
  setTimeout(tick, 320);
}
