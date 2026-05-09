import { CommunityFeed } from "@/components/community-feed";

export default function CommunityPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[2.1rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.22),_transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">Community Insights</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Real recent TradingView ideas, not mock cards</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/60">
          This feed now pulls real public TradingView community posts, including actual titles, text, images, boosts, comments, and live links back to the original ideas and charts.
        </p>
      </section>

      <CommunityFeed />
    </div>
  );
}
