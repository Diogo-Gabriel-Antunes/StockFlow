import type { StockMovement } from "@/features/stock/types";

export type ReplenishmentProduct = {
  id: string;
  productId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  referenceCode: string | null;
  category: string | null;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  suggestedQuantity: number;
  suggestedPurchaseQuantity: number;
  status: "OUT_OF_STOCK" | "LOW_STOCK";
};

export type ReplenishmentProductPage = {
  items: ReplenishmentProduct[];
  content?: ReplenishmentProduct[];
  page: number;
  size: number;
  total: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
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
