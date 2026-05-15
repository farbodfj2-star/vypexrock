"use client";

import { Expand, LoaderCircle, Play, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChartAnalysisOverlay } from "@/components/chart-analysis-overlay";
import { ChartAnalysisResult } from "@/components/chart-analysis-result";
import { ChartAnalyzerForm } from "@/components/chart-analyzer-form";
import { TalkToChartPanel } from "@/components/talk-to-chart-panel";
import { apiFetch, resolveApiAssetUrl } from "@/lib/api";
import { commoditySymbols, cryptoSymbols, displayAssetLabel, forexSymbols, getAsset, getTradingViewConfig, mergeMarketRows, stockSymbols } from "@/lib/asset-catalog";
import { buildMockChartAnalysis } from "@/lib/mock-chart-analysis";
import type { ChartAnalysisResult as AnalysisResult } from "@/lib/mock-chart-analysis";
import { buildProjectedCandles, type ProjectedCandle } from "@/lib/mock-projected-candles";
import { cn } from "@/lib/utils";
import type { MarketTicker } from "@/types";

const marketTabs = ["Crypto", "Forex", "Commodities", "Stocks"] as const;
const timeframeOptions = ["1s", "1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"] as const;
const marketSymbolMap = {
  Crypto: cryptoSymbols,
  Forex: forexSymbols,
  Commodities: commoditySymbols,
  Stocks: stockSymbols
} satisfies Record<(typeof marketTabs)[number], string[]>;

export function ChartAnalyzerWorkspace({ rows }: { rows: MarketTicker[] }) {
  const [market, setMarket] = useState<(typeof marketTabs)[number]>("Crypto");
  const [search, setSearch] = useState("");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [timeframe, setTimeframe] = useState<(typeof timeframeOptions)[number]>("30m");
  const [strategy, setStrategy] = useState("Smart Money Concepts");
  const [selectedTimeframes, setSelectedTimeframes] = useState<string[]>(["30m", "1H"]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(["RSI", "MACD", "Bollinger Bands"]);
  const [expertMode, setExpertMode] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [uploadedPreviewUrl, setUploadedPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [projectedCandles, setProjectedCandles] = useState<ProjectedCandle[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const theme = useSiteTheme();
  const isDark = theme === "dark";
  const mergedRows = useMemo(() => mergeMarketRows(rows), [rows]);

  const availableRows = useMemo(() => {
    const allowed = new Set(marketSymbolMap[market]);
    const base = mergedRows.filter((row) => allowed.has(row.symbol));
    const term = search.trim().toLowerCase();
    return base.filter((row) => `${row.symbol} ${row.metadata_name ?? ""}`.toLowerCase().includes(term));
  }, [market, mergedRows, search]);

  const symbolRows = useMemo(() => {
    const preferred = marketSymbolMap[market].map((item) => mergedRows.find((row) => row.symbol === item)).filter(Boolean) as MarketTicker[];
    const merged = search.trim() ? availableRows : preferred;
    return Array.from(new Map(merged.map((row) => [row.symbol, row])).values());
  }, [availableRows, market, mergedRows, search]);

  const currentRow = mergedRows.find((row) => row.symbol === symbol) ?? mergedRows[0];
  const chartUrl = buildTradingViewUrl(symbol, timeframe, theme);

  useEffect(() => {
    if (!availableRows.length) return;
    if (!availableRows.some((row) => row.symbol === symbol)) {
      setSymbol(availableRows[0].symbol);
      setAnalysis(null);
      setProjectedCandles([]);
    }
  }, [availableRows, symbol]);

  function toggleIndicator(value: string) {
    setSelectedIndicators((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= 4) return [...current.slice(1), value];
      return [...current, value];
    });
  }

  function toggleTimeframe(value: string) {
    setSelectedTimeframes((current) => {
      if (current.includes(value)) return current.filter((item) => item !== value);
      if (current.length >= 3) return [...current.slice(1), value];
      return [...current, value];
    });
  }

  async function runAnalysis() {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setProjectedCandles([]);

    try {
      const [result] = await Promise.all([
        fetchAnalysis(symbol, timeframe, strategy, selectedIndicators, prompt, currentRow?.price),
        wait(1800)
      ]);
      setAnalysis(result);
      setProjectedCandles(buildProjectedCandles(result));
    } catch (error) {
      const fallback = {
        ...buildMockChartAnalysis({
          symbol,
          timeframe,
          strategy,
          indicators: selectedIndicators,
          currentPrice: currentRow?.price
        }),
        source: "structured-fallback-engine"
      };
      setAnalysis(fallback);
      setProjectedCandles(buildProjectedCandles(fallback));
      setAnalysisError(
        error instanceof Error
          ? `Live analysis was unavailable, so Vypexrock generated a structured fallback briefing: ${error.message}`
          : "Live analysis was unavailable, so Vypexrock generated a structured fallback briefing."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="chart-analyzer-native w-full space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Vypexrock Chart Analyzer</h1>
          <p className="mt-2 text-sm text-white/60">Upload charts, talk to the chart, select market context, and generate structured AI trade briefings.</p>
        </div>
        <button
          type="button"
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="chart-ai-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          {isAnalyzing ? "Analyzing chart..." : "Get Vypexrock AI Analysis"}
        </button>
      </header>

      <div className="grid w-full items-start gap-5 2xl:grid-cols-[minmax(0,7fr)_minmax(360px,3fr)]">
        <main className="min-w-0 space-y-4">
          <section className={cn("chart-glass-card p-4", isDark ? "text-slate-100" : "text-slate-900")}>
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                {marketTabs.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setMarket(item)}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition",
                      market === item
                        ? isDark
                          ? "bg-white/12 text-blue-100 shadow-[0_0_22px_rgba(96,165,250,0.16)]"
                          : "bg-white/80 text-blue-700 shadow-[0_8px_24px_rgba(59,130,246,0.12)]"
                        : isDark
                          ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                          : "bg-white/45 text-slate-600 hover:bg-white/80"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search symbol"
                  className={cn(
                    "w-full rounded-2xl px-3 py-2.5 pr-10 text-sm outline-none backdrop-blur-xl placeholder:text-slate-400 focus:ring-2 focus:ring-blue-400/30",
                    isDark ? "bg-white/[0.06] text-slate-100" : "bg-white/70 text-slate-900"
                  )}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {symbolRows.map((row) => (
                  <button
                    key={row.symbol}
                    type="button"
                    onClick={() => {
                      setSymbol(row.symbol);
                      setAnalysis(null);
                      setProjectedCandles([]);
                    }}
                    className={cn(
                      "rounded-full px-3 py-2 text-sm font-medium transition",
                      symbol === row.symbol
                        ? isDark
                          ? "bg-white text-slate-950 shadow-[0_0_26px_rgba(255,255,255,0.16)]"
                          : "bg-slate-950 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]"
                        : isDark
                          ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                          : "bg-white/55 text-slate-600 hover:bg-white/90"
                    )}
                  >
                    {displayAssetLabel(row.symbol)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {timeframeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTimeframe(item);
                      setAnalysis(null);
                      setProjectedCandles([]);
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium transition",
                      timeframe === item
                        ? isDark
                          ? "bg-blue-400/16 text-blue-100 shadow-[0_0_18px_rgba(96,165,250,0.18)]"
                          : "bg-blue-50/90 text-blue-700 shadow-[0_8px_20px_rgba(59,130,246,0.12)]"
                        : isDark
                          ? "bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                          : "bg-white/55 text-slate-600 hover:bg-white/90"
                    )}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className={cn("chart-reference-frame chart-hero-frame p-4 md:p-5", isDark ? "text-slate-100" : "text-slate-900")}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
              <h2 className={cn("text-lg font-semibold", isDark ? "text-slate-50" : "text-slate-950")}>Analysis for {displayAssetLabel(symbol)}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="chart-reference-pill chart-reference-pill-active">{timeframe}</span>
                  <span className="chart-reference-pill">1H</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenOpen(true)}
                className={cn(
                  "chart-reference-result-pill inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5",
                  isDark ? "bg-white/[0.06] text-slate-200 hover:bg-white/[0.1]" : "bg-white/70 text-slate-700 hover:bg-white"
                )}
              >
                <Expand className="h-4 w-4" />
                Expand
              </button>
            </div>

            <ChartFrame
              symbol={symbol}
              chartUrl={chartUrl}
              timeframe={timeframe}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              isDark={isDark}
              projectedCandles={projectedCandles}
              className="chart-primary-height"
            />

            {analysisError ? (
              <div className="mt-3 rounded-2xl bg-amber-300/10 px-3 py-2 text-sm text-amber-100 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.18)]">
                {analysisError}
              </div>
            ) : null}

            <p className={cn("mt-3 text-sm leading-6", isDark ? "text-slate-400" : "text-slate-500")}>
              Live chart source: TradingView widget for visual context. Vypexrock draws scenario levels and AI projections in a bounded overlay above the chart.
            </p>
          </section>

          <section className="grid gap-3 md:grid-cols-4">
            <ContextCard title="London" value="Active" isDark={isDark} />
            <ContextCard title="New York" value="Opening soon" isDark={isDark} />
            <ContextCard title="Volatility" value={currentRow ? `${Math.abs(currentRow.change_24h).toFixed(2)}%` : "Normal"} isDark={isDark} />
            <ContextCard title="Market Strength" value={market === "Crypto" ? "BTC led" : "Mixed"} isDark={isDark} />
          </section>
        </main>

        <aside className="chart-analyzer-side-panel min-w-0 space-y-4 2xl:sticky 2xl:top-24 2xl:self-start">
          <ChartAnalyzerForm
            strategy={strategy}
            setStrategy={setStrategy}
            selectedTimeframes={selectedTimeframes}
            onToggleTimeframe={toggleTimeframe}
            selectedIndicators={selectedIndicators}
            onToggleIndicator={toggleIndicator}
            expertMode={expertMode}
            setExpertMode={setExpertMode}
            prompt={prompt}
            setPrompt={setPrompt}
            onUpload={(_, previewUrl) => setUploadedPreviewUrl(previewUrl)}
            isDark={isDark}
          />

          <div className="space-y-3">
            <ChartAnalysisResult analysis={analysis} isDark={isDark} />
            <TalkToChartPanel
              symbol={symbol}
              timeframe={timeframe}
              analysis={analysis}
              promptContext={prompt}
              hasUploadedChart={Boolean(uploadedPreviewUrl)}
              isDark={isDark}
            />
            {uploadedPreviewUrl ? (
              <section className={cn("chart-glass-card p-3", isDark ? "text-slate-100" : "text-slate-900")}>
                <p className={cn("text-xs font-semibold uppercase", isDark ? "text-slate-400" : "text-slate-500")}>Uploaded Reference</p>
                <img src={uploadedPreviewUrl} alt="Uploaded chart reference" className="mt-2 h-32 w-full rounded object-cover" />
              </section>
            ) : null}
            <ContextCard title="Live Engine" value={analysis?.source ?? "Ready"} isDark={isDark} />
          </div>
        </aside>
      </div>

      {fullscreenOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/78 p-3 backdrop-blur-xl md:p-6">
          <div className="chart-reference-frame relative h-[92vh] w-[95vw] p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Fullscreen Analysis for {displayAssetLabel(symbol)}</h2>
                <p className="mt-1 text-sm text-white/55">{timeframe} chart with Vypexrock AI overlay</p>
              </div>
              <button
                type="button"
                onClick={() => setFullscreenOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/16"
                aria-label="Close fullscreen chart"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ChartFrame
              symbol={symbol}
              chartUrl={chartUrl}
              timeframe={timeframe}
              analysis={analysis}
              isAnalyzing={isAnalyzing}
              isDark={isDark}
              projectedCandles={projectedCandles}
              className="h-[calc(92vh-92px)]"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ChartFrame({
  symbol,
  chartUrl,
  timeframe,
  analysis,
  isAnalyzing,
  isDark,
  projectedCandles,
  className
}: {
  symbol: string;
  chartUrl: string;
  timeframe: string;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  isDark: boolean;
  projectedCandles: ProjectedCandle[];
  className: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[28px] transition-shadow duration-500",
        isAnalyzing ? "chart-analyzing-frame" : "chart-ambient-frame",
        isDark ? "bg-slate-950/80" : "bg-white/80"
      )}
    >
      <div className={className}>
        <iframe title={`${symbol} ${timeframe} TradingView`} src={chartUrl} className="h-full w-full" allowTransparency />
      </div>
      <ChartAnalysisOverlay analysis={analysis} loading={isAnalyzing} isDark={isDark} projectedCandles={projectedCandles} />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ContextCard({ title, value, isDark }: { title: string; value: string; isDark: boolean }) {
  return (
            <div className={cn("chart-glass-card p-3", isDark ? "text-slate-100" : "text-slate-900")}>
      <p className={cn("text-xs font-semibold uppercase", isDark ? "text-slate-400" : "text-slate-500")}>{title}</p>
      <p className={cn("mt-1 text-sm font-semibold", isDark ? "text-slate-50" : "text-slate-950")}>{value}</p>
    </div>
  );
}

async function fetchAnalysis(symbol: string, timeframe: string, strategy: string, indicators: string[], prompt: string, currentPrice?: number) {
  const asset = getAsset(symbol);
  const backendSupported = asset?.liveSource === "binance" || asset?.liveSource === "gold-api";

  if (!backendSupported) {
    return {
      ...buildMockChartAnalysis({ symbol, timeframe, strategy, indicators, currentPrice }),
      source: "structured-fallback-engine"
    };
  }

  const result = await apiFetch<AnalysisResult>("/chart/analyze", {
    method: "POST",
    body: JSON.stringify({
      symbol,
      timeframe,
      strategy,
      indicators,
      prompt
    })
  });

  return {
    ...result,
    chartImageUrl: resolveApiAssetUrl(result.chartImageUrl) ?? undefined,
    analyzedChartImageUrl: resolveApiAssetUrl(result.analyzedChartImageUrl) ?? undefined
  };
}

function buildTradingViewUrl(symbol: string, interval: string, theme: "dark" | "light") {
  const { provider, symbol: mappedSymbol } = getTradingViewConfig(symbol);
  const intervalMap: Record<string, string> = {
    "1s": "1S",
    "1m": "1",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1H": "60",
    "4H": "240",
    "1D": "1D",
    "1W": "1W"
  };
  const toolbarBg = theme === "dark" ? "111827" : "f8fafc";
  return `https://s.tradingview.com/widgetembed/?symbol=${provider}%3A${mappedSymbol}&interval=${intervalMap[interval] ?? "30"}&hidesidetoolbar=0&symboledit=0&saveimage=0&toolbarbg=${toolbarBg}&theme=${theme}&style=1&timezone=Etc%2FUTC&studies=[]&hideideas=1&withdateranges=1`;
}

function useSiteTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const readTheme = () => setTheme(document.body.dataset.theme === "light" ? "light" : "dark");
    readTheme();
    const observer = new MutationObserver(readTheme);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
