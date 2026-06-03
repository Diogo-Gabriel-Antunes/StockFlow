export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "CANCELLATION";

export type StockMovement = {
  id: string;
  companyId: string;
  productId: string;
  productName: string;
  productSku: string | null;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string;
  createdAt: string;
};

export type StockMovementPage = {
  items: StockMovement[];
  page: number;
  size: number;
  total: number;
};

export type StockMovementInput = {
  productId: string;
  quantity: number;
  reason?: string;
};

export type StockAdjustmentInput = {
  productId: string;
  newQuantity: number;
  reason?: string;
};

export type LowStockProduct = {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  suggestedPurchaseQuantity: number;
};
