import { apiRequest } from "@/services/http";
import type { ReplenishmentEntry, ReplenishmentEntryInput, ReplenishmentProduct } from "./types";

export function listReplenishmentProducts(token: string) {
  return apiRequest<ReplenishmentProduct[]>("/replenishments", { token });
}

export function registerReplenishmentEntry(token: string, input: ReplenishmentEntryInput) {
  return apiRequest<ReplenishmentEntry>("/replenishments/entries", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}
