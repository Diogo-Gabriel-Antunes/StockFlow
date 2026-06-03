import type { QuoteStatus } from "@/features/quotes/types";

export type DashboardLowStockProduct = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  stockQuantity: number;
  minimumStock: number;
  suggestedPurchaseQuantity: number;
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
  email: string | null;
  phone: string | null;
  createdAt: string;
};

export type DashboardSummary = {
  totalQuotesMonth: number;
  approvedValueMonth: number;
  openValue: number;
  approvalRate: number;
  lowStockProductCount: number;
  lowStockProducts: DashboardLowStockProduct[];
  recentQuotes: DashboardQuote[];
  recentCustomers: DashboardCustomer[];
};
