import { apiRequest } from "@/services/http";
import type { DashboardSummary } from "./types";

export function getDashboardSummary(token: string) {
  return apiRequest<DashboardSummary>("/dashboard/summary", { token });
}
