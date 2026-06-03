import { apiRequest } from "@/services/http";
import type {
  LowStockProduct,
  StockAdjustmentInput,
  StockMovement,
  StockMovementInput,
  StockMovementPage,
} from "./types";

type MovementParams = {
  productId?: string;
  page?: number;
  size?: number;
};

export function listStockMovements(token: string, params: MovementParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.productId) {
    searchParams.set("productId", params.productId);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 20));

  return apiRequest<StockMovementPage>(`/stock/movements?${searchParams.toString()}`, { token });
}

export function listLowStockProducts(token: string) {
  return apiRequest<LowStockProduct[]>("/stock/low", { token });
}

export function createStockEntry(token: string, input: StockMovementInput) {
  return apiRequest<StockMovement>("/stock/entries", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function createStockOutput(token: string, input: StockMovementInput) {
  return apiRequest<StockMovement>("/stock/outputs", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function createStockAdjustment(token: string, input: StockAdjustmentInput) {
  return apiRequest<StockMovement>("/stock/adjustments", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}
