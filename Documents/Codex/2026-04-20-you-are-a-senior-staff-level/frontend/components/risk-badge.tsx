import { cn } from "@/lib/utils";

export function RiskBadge({ value }: { value: "Low" | "Medium" | "High" | string }) {
  const styles =
    value === "Low"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : value === "High"
        ? "border-rose-300/22 bg-rose-400/10 text-rose-100"
        : "border-amber-300/22 bg-amber-300/10 text-amber-100";

  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-bold", styles)}>{value} risk</span>;
}
