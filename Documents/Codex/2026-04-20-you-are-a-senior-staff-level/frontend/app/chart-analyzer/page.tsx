import { apiFetch } from "@/lib/api";
import { dashboardFallbackRows } from "@/lib/mock-data";
import type { MarketTicker } from "@/types";
import { ChartAnalyzerWorkspace } from "@/components/chart-analyzer-workspace";

async function getRows() {
  try {
    return await apiFetch<MarketTicker[]>("/market/dashboard");
  } catch {
    return dashboardFallbackRows;
  }
}

export default async function ChartAnalyzerPage() {
  const rows = await getRows();
  return <ChartAnalyzerWorkspace rows={rows} />;
}
