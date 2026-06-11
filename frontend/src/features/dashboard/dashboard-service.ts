import { apiRequest } from "@/services/http";
import type { DashboardPeriodKey, DashboardSummary } from "./types";

export type DashboardSummaryParams = {
  period?: DashboardPeriodKey;
  dateFrom?: string;
  dateTo?: string;
};

export function getDashboardSummary(
  token: string,
  params: DashboardSummaryParams = {},
) {
  const searchParams = new URLSearchParams();
  if (params.period) {
    searchParams.set("period", params.period);
  }
  if (params.period === "custom" && params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }
  if (params.period === "custom" && params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }
  const query = searchParams.toString();
  return apiRequest<DashboardSummary>(`/dashboard/summary${query ? `?${query}` : ""}`, { token });
}
