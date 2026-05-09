import { PricingCards } from "@/components/pricing-cards";
import { pricingPlans } from "@/lib/mock-pricing";

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(245,200,74,0.14),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(79,70,229,0.2),_transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] lg:p-8">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold text-white lg:text-5xl">Monetization-ready plans for a premium research product</h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-white/62 lg:text-base">
          The pricing structure is designed so you can grow Vypexrock from a luxury AI research workspace into a real recurring-revenue SaaS without changing the product story later.
        </p>
      </section>

      <PricingCards plans={pricingPlans} />

      <section className="rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-6 py-5 text-sm leading-7 text-white/48">
        Premium plan labels, locked features, and upgrade cues are present for product readiness. Payment processing can be connected later without redesigning the experience.
      </section>
    </div>
  );
}
