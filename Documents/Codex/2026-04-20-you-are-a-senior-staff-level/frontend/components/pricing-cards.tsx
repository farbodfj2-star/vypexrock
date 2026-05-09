import { Crown, Lock, Sparkles } from "lucide-react";

import type { PricingPlan } from "@/types";

export function PricingCards({ plans }: { plans: PricingPlan[] }) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      {plans.map((plan, index) => (
        <section
          key={plan.name}
          className={`rounded-[2rem] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] ${
            index === 1
              ? "border-violet-400/25 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))]"
              : "border-white/10 bg-white/[0.04]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">{plan.name}</p>
              <h2 className="mt-3 text-4xl font-semibold text-white">{plan.price}</h2>
            </div>
            {plan.badge ? (
              <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">
                {plan.badge}
              </div>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-7 text-white/60">{plan.description}</p>

          <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-slate-950">
            {index === 0 ? <Sparkles className="h-4 w-4" /> : <Crown className="h-4 w-4" />}
            {plan.cta}
          </button>

          <div className="mt-6 space-y-3">
            {plan.features.map((feature) => (
              <div key={feature} className="rounded-[1.2rem] border border-white/10 bg-[#0d1224] px-4 py-3 text-sm text-white/72">
                {feature}
              </div>
            ))}
          </div>

          {plan.lockedNote ? (
            <div className="mt-6 flex items-start gap-3 rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-sm text-white/56">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
              {plan.lockedNote}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
