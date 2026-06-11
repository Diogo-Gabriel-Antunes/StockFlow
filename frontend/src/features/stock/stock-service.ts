import { apiRequest } from "@/services/http";
import type {
  LowStockProduct,
  StockAdjustmentInput,
  StockMovement,
  StockMovementInput,
  StockMovementPage,
} from "./types";

type MovementParams = {
  dateFrom?: string;
  dateTo?: string;
  productId?: string;
  search?: string;
  type?: StockMovement["type"] | "";
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
};

export function listStockMovements(token: string, params: MovementParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.productId) {
    searchParams.set("productId", params.productId);
  }
  if (params.type) {
    searchParams.set("type", params.type);
  }
  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }
  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (params.direction) {
    searchParams.set("direction", params.direction);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));

  return apiRequest<StockMovementPage>(`/stock/movements?${searchParams.toString()}`, { token });
}

export function listStockMovementsByProduct(
  token: string,
  productId: string,
  params: Omit<MovementParams, "productId"> = {},
) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));

  return apiRequest<StockMovementPage>(
    `/stock/movements/product/${productId}?${searchParams.toString()}`,
    { token },
  );
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
