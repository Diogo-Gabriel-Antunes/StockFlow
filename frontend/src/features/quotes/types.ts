export type QuoteStatus = "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export type QuoteItemType = "PRODUCT" | "SERVICE";

export type QuoteItem = {
  id: string;
  itemType: QuoteItemType;
  productId: string | null;
  serviceId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
};

export type Quote = {
  id: string;
  companyId: string;
  customerId: string;
  customerName: string;
  code: string;
  status: QuoteStatus;
  validUntil: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
};

export type QuotePage = {
  items: Quote[];
  page: number;
  size: number;
  total: number;
};

export type QuoteItemFormInput = {
  itemType: QuoteItemType;
  productId?: string;
  serviceId?: string;
  description?: string;
  quantity: string;
  unitPrice: string;
  discount: string;
};

export type QuoteFormInput = {
  customerId: string;
  validUntil?: string;
  discount: string;
  shipping: string;
  notes?: string;
  paymentTerms?: string;
  items: QuoteItemFormInput[];
};

export type QuoteItemInput = {
  itemType: QuoteItemType;
  productId?: string;
  serviceId?: string;
  description?: string;
  quantity: number;
  unitPrice?: number;
  discount?: number;
};

export type QuoteInput = {
  customerId: string;
  validUntil?: string;
  discount?: number;
  shipping?: number;
  notes?: string;
  paymentTerms?: string;
  items: QuoteItemInput[];
};

export type PublicQuoteLink = {
  token: string;
  url: string;
  expiresAt: string;
};

export type PublicQuote = {
  companyName: string;
  companyEmail: string | null;
  customerName: string;
  code: string;
  status: QuoteStatus;
  validUntil: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  notes: string | null;
  paymentTerms: string | null;
  items: QuoteItem[];
};
