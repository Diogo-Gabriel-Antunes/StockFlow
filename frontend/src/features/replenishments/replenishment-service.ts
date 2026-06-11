import { apiRequest } from "@/services/http";
import type { ReplenishmentEntry, ReplenishmentEntryInput, ReplenishmentProductPage } from "./types";

type ListParams = {
  page?: number;
  search?: string;
  size?: number;
  status?: "OUT_OF_STOCK" | "LOW_STOCK" | "";
};

export function listReplenishmentProducts(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));

  return apiRequest<ReplenishmentProductPage>(`/stock/replenishment?${searchParams.toString()}`, { token });
}

export function registerReplenishmentEntry(token: string, input: ReplenishmentEntryInput) {
  return apiRequest<ReplenishmentEntry>(`/stock/replenishment/${input.productId}/restock`, {
    method: "POST",
    token,
    body: JSON.stringify({
      quantity: input.quantity,
      reason: input.reason,
    }),
  });
}
