import type { StockMovement } from "@/features/stock/types";

export type ReplenishmentProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  suggestedPurchaseQuantity: number;
};

export type ReplenishmentEntryInput = {
  productId: string;
  quantity: number;
  reason?: string;
};

export type ReplenishmentEntry = {
  replenishmentId: string;
  movement: StockMovement;
};
