import type { QuoteItem, QuoteStatus } from "@/features/quotes/types";

export type PortalCustomer = {
  id: string;
  name: string;
  document: string | null;
  email: string | null;
  phone: string | null;
};

export type PortalCompany = {
  tradeName: string;
  document: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  city: string | null;
  state: string | null;
};

export type CustomerPortalOverview = {
  customer: PortalCustomer;
  company: PortalCompany;
  summary: {
    openQuotes: number;
    completedQuotes: number;
    quoteRequests: number;
  };
};

export type CustomerPortalQuote = {
  id: string;
  code: string;
  status: QuoteStatus;
  statusLabel: string;
  total: number;
  createdAt: string;
  validUntil: string | null;
  canApprove: boolean;
  canReject: boolean;
  canDownloadPdf: boolean;
  subtotal: number;
  discount: number;
  shipping: number;
  notes: string | null;
  paymentTerms: string | null;
  items: QuoteItem[];
};

export type CustomerPortalQuotePage = {
  content: CustomerPortalQuote[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type QuoteRequestStatus = "REQUESTED" | "IN_REVIEW" | "CONVERTED_TO_QUOTE" | "CANCELLED";

export type QuoteRequestItem = {
  id: string;
  productId: string | null;
  description: string | null;
  quantity: number;
  notes: string | null;
  productNameSnapshot: string | null;
  productSkuSnapshot: string | null;
  productReferenceSnapshot: string | null;
  productImageUrlSnapshot: string | null;
};

export type QuoteRequest = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  description: string | null;
  status: QuoteRequestStatus;
  convertedQuoteId: string | null;
  convertedQuoteCode: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  convertedAt: string | null;
  canEdit: boolean;
  canCancel: boolean;
  items: QuoteRequestItem[];
};

export type QuoteRequestPage = {
  items: QuoteRequest[];
  content: QuoteRequest[];
  page: number;
  size: number;
  total: number;
  totalElements: number;
  totalPages: number;
};

export type QuoteRequestInput = {
  title: string;
  description?: string;
  items: Array<{
    productId?: string;
    description?: string;
    quantity: number;
    notes?: string;
  }>;
};

export type PortalProduct = {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  referenceCode: string | null;
  imageUrl: string | null;
};

export type PortalProductPage = {
  items: PortalProduct[];
  content: PortalProduct[];
  page: number;
  size: number;
  total: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};
