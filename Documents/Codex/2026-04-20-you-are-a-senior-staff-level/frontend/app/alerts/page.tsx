"use client";

import { useQuery } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Clock3, Sparkles, Target } from "lucide-react";

import { AlertForm } from "@/components/alert-form";
import { TelegramLinkCard } from "@/components/telegram-link-card";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Alert, AlertLog } from "@/types";

export default function AlertsPage() {
  const token = useAuthStore((state) => state.token);
  const alertsQuery = useQuery({
    queryKey: ["alerts", token],
    queryFn: () => apiFetch<Alert[]>("/alerts", { token }),
    enabled: Boolean(token)
  });
  const logsQuery = useQuery({
    queryKey: ["alert-logs", token],
    queryFn: () => apiFetch<AlertLog[]>("/alerts/logs", { token }),
    enabled: Boolean(token)
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Automation</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Alerts and delivery</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
          Configure premium trigger logic and route structured notifications into your Vypexrock workflow.
        </p>
      </section>

      {!token ? <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-white/70">Sign in to manage alerts.</div> : null}
      {token ? <AlertForm onCreated={() => alertsQuery.refetch()} /> : null}
      {token ? <TelegramLinkCard /> : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 text-white">
            <BellRing className="h-4 w-4 text-cyan-300" />
            <h2 className="text-lg font-semibold text-white">Active alerts</h2>
          </div>
          <div className="mt-5 space-y-3">
            {alertsQuery.data?.length ? (
              alertsQuery.data.map((alert) => (
                <div key={alert.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        {alert.symbol} | {alert.condition_type} | {alert.direction}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/55">
                        Threshold: {alert.threshold_value ?? "n/a"} | Cooldown: {alert.cool_down_minutes}m
                      </p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em]",
                        alert.is_active
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : "border-white/10 bg-white/[0.04] text-white/45"
                      )}
                    >
                      {alert.is_active ? "Live" : "Paused"}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <MiniStat label="Direction" value={alert.direction} />
                    <MiniStat label="Last triggered" value={alert.last_triggered_at ? formatRelative(alert.last_triggered_at) : "Never"} />
                    <MiniStat label="Created" value={formatRelative(alert.created_at)} />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Target}
                title="No alerts yet"
                description="Start with a breakout, breakdown, or signal-flip rule so Vypexrock can watch the market for you instead of making you stare at the chart."
              />
            )}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-violet-300" />
            <h2 className="text-lg font-semibold text-white">Recent trigger log</h2>
          </div>
          <div className="mt-5 space-y-3">
            {logsQuery.data?.length ? (
              logsQuery.data.map((log) => (
                <div key={log.id} className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{log.symbol}</p>
                      <p className="mt-2 text-sm leading-6 text-white/65">{log.message}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/45">
                      {log.delivery_status}
                    </span>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/35">{formatRelative(log.created_at)}</p>
                </div>
              ))
            ) : (
              <EmptyState
                icon={Clock3}
                title="No trigger history yet"
                description="Once an alert fires, this area will show delivery history, timing, and what exactly happened so the workflow feels complete instead of empty."
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <GuideCard
          title="Breakout alerts"
          text="Best when price is compressing below a major level and you want confirmation before acting."
        />
        <GuideCard
          title="RSI alerts"
          text="Useful for momentum extremes, especially when you want to wait for exhaustion instead of chasing."
        />
        <GuideCard
          title="Signal-change alerts"
          text="Best for hands-off monitoring when you want the platform to tell you when bias flips long, short, or neutral."
        />
      </section>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description
}: {
  icon: typeof Target;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/12 bg-[#0d1224] p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-white/56">{description}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-[#0d1224] p-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/35">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function GuideCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
      <div className="flex items-center gap-2 text-white">
        <CheckCircle2 className="h-4 w-4 text-violet-300" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-7 text-white/58">{text}</p>
    </div>
  );
}

function formatRelative(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
