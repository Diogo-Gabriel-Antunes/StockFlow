import type { QuoteStatus } from "@/features/quotes/types";
import type { StockMovementType } from "@/features/stock/types";

export type DashboardCriticalProduct = {
  id: string;
  name: string;
  sku: string | null;
  stockQuantity: number;
  minimumStock: number;
  status: "OUT_OF_STOCK" | "LOW_STOCK";
};

export type DashboardQuote = {
  id: string;
  code: string;
  customerName: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
};

export type DashboardCustomer = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type DashboardStockMovement = {
  id: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason: string | null;
  createdAt: string;
};

export type DashboardPeriodKey =
  | "today"
  | "last7days"
  | "currentMonth"
  | "previousMonth"
  | "custom";

export type DashboardSummary = {
  period: {
    dateFrom: string;
    dateTo: string;
  };
  quotes: {
    total: number;
    approvedByCustomer: number;
    completed: number;
    rejected: number;
    cancelled: number;
    open: number;
    approvedAmount: number;
    openAmount: number;
    approvalRate: number;
  };
  stock: {
    lowStockCount: number;
    outOfStockCount: number;
  };
  customers: {
    total: number;
    createdInPeriod: number;
  };
  recentQuotes: DashboardQuote[];
  recentCustomers: DashboardCustomer[];
  recentStockMovements: DashboardStockMovement[];
  criticalProducts: DashboardCriticalProduct[];
};
