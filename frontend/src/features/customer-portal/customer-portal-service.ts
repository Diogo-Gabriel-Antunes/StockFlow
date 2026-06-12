import { env } from "@/lib/env";
import { apiRequest } from "@/services/http";
import type {
  CustomerPortalOverview,
  CustomerPortalQuote,
  CustomerPortalQuotePage,
  PortalProduct,
  PortalProductPage,
  QuoteRequest,
  QuoteRequestInput,
  QuoteRequestPage,
  QuoteRequestStatus,
} from "./types";

export function getCustomerPortal(token: string) {
  return apiRequest<CustomerPortalOverview>(`/public/customer-portal/${token}`);
}

export function listPortalQuotes(token: string, statusGroup: "open" | "completed") {
  return apiRequest<CustomerPortalQuotePage>(
    `/public/customer-portal/${token}/quotes?statusGroup=${statusGroup}&page=0&size=10`,
  );
}

export function getPortalQuote(token: string, quoteId: string) {
  return apiRequest<CustomerPortalQuote>(`/public/customer-portal/${token}/quotes/${quoteId}`);
}

export function approvePortalQuote(token: string, quoteId: string) {
  return apiRequest<CustomerPortalQuote>(`/public/customer-portal/${token}/quotes/${quoteId}/approve`, {
    method: "POST",
  });
}

export function rejectPortalQuote(token: string, quoteId: string, reason?: string) {
  return apiRequest<CustomerPortalQuote>(`/public/customer-portal/${token}/quotes/${quoteId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
}

export function portalQuotePdfUrl(token: string, quoteId: string) {
  return `${env.apiUrl}/public/customer-portal/${token}/quotes/${quoteId}/pdf`;
}

export function listPortalProducts(
  token: string,
  params: { page?: number; search?: string; size?: number } = {},
) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 12));
  return apiRequest<PortalProductPage>(`/public/customer-portal/${token}/products?${searchParams.toString()}`);
}

export function searchPortalProducts(token: string, query: string) {
  const searchParams = new URLSearchParams({ query });
  return apiRequest<PortalProduct[]>(`/public/customer-portal/${token}/products/search?${searchParams.toString()}`);
}

export function getPortalProduct(token: string, productId: string) {
  return apiRequest<PortalProduct>(`/public/customer-portal/${token}/products/${productId}`);
}

export function listPortalQuoteRequests(token: string) {
  return apiRequest<QuoteRequest[]>(`/public/customer-portal/${token}/quote-requests`);
}

export function getPortalQuoteRequest(token: string, requestId: string) {
  return apiRequest<QuoteRequest>(`/public/customer-portal/${token}/quote-requests/${requestId}`);
}

export function createPortalQuoteRequest(token: string, input: QuoteRequestInput) {
  return apiRequest<QuoteRequest>(`/public/customer-portal/${token}/quote-requests`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePortalQuoteRequest(token: string, requestId: string, input: QuoteRequestInput) {
  return apiRequest<QuoteRequest>(`/public/customer-portal/${token}/quote-requests/${requestId}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function cancelPortalQuoteRequest(token: string, requestId: string) {
  return apiRequest<QuoteRequest>(`/public/customer-portal/${token}/quote-requests/${requestId}/cancel`, {
    method: "POST",
  });
}

export function listInternalQuoteRequests(
  token: string,
  params: { page?: number; search?: string; size?: number; status?: QuoteRequestStatus | "" } = {},
) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));
  return apiRequest<QuoteRequestPage>(`/quote-requests?${searchParams.toString()}`, { token });
}

export function getInternalQuoteRequest(token: string, id: string) {
  return apiRequest<QuoteRequest>(`/quote-requests/${id}`, { token });
}

export function updateInternalQuoteRequestStatus(token: string, id: string, status: QuoteRequestStatus) {
  return apiRequest<QuoteRequest>(`/quote-requests/${id}/status`, {
    method: "PUT",
    token,
    body: JSON.stringify({ status }),
  });
}

export function convertQuoteRequestToQuote(token: string, id: string) {
  return apiRequest<{ id: string }>(`/quote-requests/${id}/convert-to-quote`, {
    method: "POST",
    token,
  });
}
