"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, BellRing, CheckCircle2, Loader2, Radio, Send, ShieldAlert, SlidersHorizontal } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type TelegramAccount = {
  id: number;
  chat_id: string;
  username?: string | null;
  bot_token_configured: boolean;
};

type TelegramSettings = {
  bot_configured: boolean;
  env_bot_configured: boolean;
  user_bot_configured: boolean;
  env_chat_configured: boolean;
  linked_chat_configured: boolean;
  enabled: boolean;
  signal_alerts_enabled: boolean;
  market_update_enabled: boolean;
  interval_minutes: number;
  market_update_interval_minutes: number;
  signal_interval_minutes: number;
  top_assets_count: number;
  min_confidence: number;
  min_risk_reward: number;
  cooldown_minutes: number;
  check_interval_seconds: number;
  timeframe: string;
  symbols: string[];
  market_symbols: string[];
  last_sent_at?: string | null;
  last_market_update_sent_at?: string | null;
  last_best_setup_sent_at?: string | null;
  market_message_preview?: string | null;
  best_setup_message_preview?: string | null;
  recent_logs: Array<{
    type: string;
    status: string;
    detail: string;
    sent_at: string;
    symbol?: string | null;
  }>;
};

export function TelegramLinkCard() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [username, setUsername] = useState("");
  const [settings, setSettings] = useState<TelegramSettings | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTestingSignal, setIsTestingSignal] = useState(false);
  const [isTestingMarket, setIsTestingMarket] = useState(false);
  const activeToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : null);

  useEffect(() => {
    if (!activeToken) return;
    apiFetch<TelegramAccount | null>("/telegram", { token: activeToken })
      .then((account) => {
        if (account) {
          setChatId(account.chat_id);
          setUsername(account.username ?? "");
        }
      })
      .catch(() => undefined);
    apiFetch<TelegramSettings>("/telegram/settings", { token: activeToken })
      .then(setSettings)
      .catch(() => undefined);
  }, [activeToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!activeToken) {
      setMessage("Sign in to link Telegram.");
      return;
    }
    try {
      setIsSaving(true);
      await apiFetch("/telegram/link", {
        method: "POST",
        token: activeToken,
        body: JSON.stringify({ chat_id: chatId, username, bot_token: botToken.trim() || undefined })
      });
      setBotToken("");
      const nextSettings = await apiFetch<TelegramSettings>("/telegram/settings", { token: activeToken });
      setSettings(nextSettings);
      setMessage("Telegram settings saved successfully.");
    } catch (error) {
      handleRequestError(error, clearSession, router.push, setMessage);
    } finally {
      setIsSaving(false);
    }
  }

  async function testMessage() {
    if (!activeToken) return;
    try {
      setIsTesting(true);
      const response = await apiFetch<{ status: string; detail: string }>("/telegram/test", { method: "POST", token: activeToken });
      setMessage(`${response.detail} Status: ${response.status}.`);
    } catch (error) {
      handleRequestError(error, clearSession, router.push, setMessage);
    } finally {
      setIsTesting(false);
    }
  }

  async function testSignal() {
    if (!activeToken) return;
    try {
      setIsTestingSignal(true);
      const response = await apiFetch<{ status: string; detail: string }>("/telegram/test-best-setup", { method: "POST", token: activeToken });
      setMessage(`${response.detail} Status: ${response.status}.`);
      const nextSettings = await apiFetch<TelegramSettings>("/telegram/settings", { token: activeToken });
      setSettings(nextSettings);
    } catch (error) {
      handleRequestError(error, clearSession, router.push, setMessage);
    } finally {
      setIsTestingSignal(false);
    }
  }

  async function testMarketReport() {
    if (!activeToken) return;
    try {
      setIsTestingMarket(true);
      const response = await apiFetch<{ status: string; detail: string }>("/telegram/test-market-report", { method: "POST", token: activeToken });
      setMessage(`${response.detail} Status: ${response.status}.`);
      const nextSettings = await apiFetch<TelegramSettings>("/telegram/settings", { token: activeToken });
      setSettings(nextSettings);
    } catch (error) {
      handleRequestError(error, clearSession, router.push, setMessage);
    } finally {
      setIsTestingMarket(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-white">
            <BellRing className="h-5 w-5 text-cyan-300" />
            <h2 className="text-lg font-semibold text-white">Telegram signal automation</h2>
          </div>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-white/55">
            Vypexrock sends a clean hourly market pulse plus one best 4H setup when the signal reaches at least medium confidence and passes risk/reward plus cooldown rules.
          </p>
        </div>
          <StatusPill
          active={Boolean(settings?.bot_configured && (settings.env_chat_configured || settings.linked_chat_configured))}
          label={settings?.bot_configured ? "Bot configured" : "Bot token missing"}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={onSubmit} className="rounded-[1.6rem] border border-white/10 bg-[#0d1224]/75 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <Send className="h-4 w-4 text-violet-300" />
            Delivery settings
          </h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm text-white/50">
              Telegram Bot Token
              <input
                type="password"
                value={botToken}
                onChange={(event) => setBotToken(event.target.value)}
                placeholder={settings?.user_bot_configured || settings?.env_bot_configured ? "Token saved. Paste a new token to replace it." : "Paste your Telegram Bot Token"}
                autoComplete="off"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-cyan-300/50"
              />
              <span className="mt-2 block text-xs leading-5 text-white/35">
                Saved securely in your local database. Leave blank to keep the current token.
              </span>
            </label>
            <label className="text-sm text-white/50">
              Chat ID
              <input
                value={chatId}
                onChange={(event) => setChatId(event.target.value)}
                placeholder="Example: 123456789"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
              />
            </label>
            <label className="text-sm text-white/50">
              Username optional
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="@your_username"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none transition focus:border-cyan-300/50"
              />
            </label>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-white/35">Automation</p>
              <p className={cn("mt-2 text-sm font-semibold", settings?.enabled ? "text-emerald-300" : "text-amber-300")}>
              {settings?.market_update_enabled ? "Hourly market pulse enabled" : "Market pulse disabled"}
              </p>
              <p className="mt-2 text-xs leading-5 text-white/40">
                Token source: {settings?.user_bot_configured ? "Saved in profile" : settings?.env_bot_configured ? "backend/.env" : "Missing"}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Telegram link
            </button>
            <button
              type="button"
              onClick={testMessage}
              disabled={isTesting}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Test message
            </button>
            <button
              type="button"
              onClick={testSignal}
              disabled={isTestingSignal}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTestingSignal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Test best setup + chart
            </button>
            <button
              type="button"
              onClick={testMarketReport}
              disabled={isTestingMarket}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isTestingMarket ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
              Test hourly market update
            </button>
          </div>
          {message ? <p className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm leading-6 text-cyan-100">{message}</p> : null}
        </form>

        <div className="rounded-[1.6rem] border border-white/10 bg-[#0d1224]/75 p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
            <SlidersHorizontal className="h-4 w-4 text-cyan-300" />
            Automation rules
          </h3>
          <div className="mt-4 grid gap-3">
            <ReadOnlySetting label="Hourly market pulse" value={settings?.market_update_enabled ? "Enabled" : "Disabled"} />
            <ReadOnlySetting label="Best setup scan" value={settings?.signal_alerts_enabled ? "Enabled" : "Disabled"} />
            <ReadOnlySetting label="Market update interval" value={`${settings?.market_update_interval_minutes ?? 60} minutes`} />
            <ReadOnlySetting label="Signal scan interval" value={`${settings?.signal_interval_minutes ?? 60} minutes`} />
            <ReadOnlySetting label="Top assets count" value={`${settings?.top_assets_count ?? 15}`} />
            <ReadOnlySetting label="Minimum confidence" value={`${settings?.min_confidence ?? 50}%`} />
            <ReadOnlySetting label="Minimum risk/reward" value={`${settings?.min_risk_reward ?? 1.5}R`} />
            <ReadOnlySetting label="Cooldown" value={`${settings?.cooldown_minutes ?? 180} minutes per symbol/timeframe`} />
            <ReadOnlySetting label="Default timeframe" value={settings?.timeframe ?? "4H"} />
            <ReadOnlySetting label="Last market update" value={settings?.last_market_update_sent_at ? formatDateTime(settings.last_market_update_sent_at) : "No market pulse yet"} />
            <ReadOnlySetting label="Last best setup" value={settings?.last_best_setup_sent_at ? formatDateTime(settings.last_best_setup_sent_at) : "No best setup sent yet"} />
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-white/35">Watched assets</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(settings?.market_symbols ?? settings?.symbols ?? ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT"]).map((symbol) => (
                <span key={symbol} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-white/70">
                  {symbol}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/35">
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
              Recent Telegram logs
            </p>
            <div className="mt-3 space-y-2">
              {settings?.recent_logs?.length ? (
                settings.recent_logs.slice(0, 5).map((log, index) => (
                  <div key={`${log.sent_at}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="text-xs font-semibold text-white">{log.type} | {log.status}</p>
                    <p className="mt-1 text-xs leading-5 text-white/45">{log.detail}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/30">{formatDateTime(log.sent_at)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-white/45">No Telegram automation messages sent yet.</p>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs leading-6 text-white/45">
            Scheduled reports run from the backend every {settings?.market_update_interval_minutes ?? 60} minutes. Weak setups below 50% confidence are skipped automatically.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <MessagePreview title="Market message preview" value={settings?.market_message_preview} />
        <MessagePreview title="Best setup preview" value={settings?.best_setup_message_preview} />
      </div>
    </section>
  );
}

function StatusPill({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
        active ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-amber-300/25 bg-amber-300/10 text-amber-200"
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", active ? "bg-emerald-300" : "bg-amber-300")} />
      {label}
    </span>
  );
}

function ReadOnlySetting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-sm text-white/50">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function MessagePreview({ title, value }: { title: string; value?: string | null }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-[#0d1224]/70 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{title}</p>
      <pre className="mt-3 whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-6 text-white/70">
        {value ?? "Preview will appear after settings load."}
      </pre>
    </div>
  );
}

function handleRequestError(
  error: unknown,
  clearSession: () => void,
  navigate: (href: string) => void,
  setMessage: (value: string) => void
) {
  const message = error instanceof Error ? error.message : "Could not save Telegram settings.";
  setMessage(message);
  if (message.includes("session expired") || message.includes("sign in again")) {
    clearSession();
    window.setTimeout(() => navigate("/login"), 900);
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
