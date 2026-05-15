import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function DashboardWidget({
  title,
  eyebrow,
  icon: Icon,
  value,
  description,
  children,
  action,
  accent = "cyan"
}: {
  title: string;
  eyebrow?: string;
  icon?: LucideIcon;
  value?: string;
  description?: string;
  children?: ReactNode;
  action?: ReactNode;
  accent?: "cyan" | "violet" | "emerald" | "rose";
}) {
  const accentClass = {
    cyan: "text-cyan-100 bg-cyan-300/10",
    violet: "text-violet-100 bg-violet-400/10",
    emerald: "text-emerald-100 bg-emerald-400/10",
    rose: "text-rose-100 bg-rose-400/10"
  }[accent];

  return (
    <section className="terminal-glass-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className={`grid h-11 w-11 place-items-center rounded-2xl border border-white/10 ${accentClass}`}>
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <div>
            {eyebrow ? <p className="text-xs uppercase tracking-[0.24em] text-white/36">{eyebrow}</p> : null}
            <h2 className="mt-1 text-xl font-semibold text-white">{title}</h2>
          </div>
        </div>
        {action}
      </div>
      {value ? <p className="text-3xl font-semibold text-white">{value}</p> : null}
      {description ? <p className="mt-2 text-sm leading-6 text-white/56">{description}</p> : null}
      {children}
    </section>
  );
}
