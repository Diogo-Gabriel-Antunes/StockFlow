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
  createdByName: string;
  createdAt: string;
};

export type StockMovementPage = {
  items: StockMovement[];
  content?: StockMovement[];
  page: number;
  size: number;
  total: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
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
  barcode: string | null;
  referenceCode: string | null;
  category: string | null;
  salePrice: number;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  stockStatus: "OUT_OF_STOCK" | "LOW_STOCK";
  suggestedPurchaseQuantity: number;
};
