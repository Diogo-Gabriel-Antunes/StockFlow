import { apiRequest } from "@/services/http";
import { env } from "@/lib/env";
import type { PublicQuote, PublicQuoteLink, Quote, QuoteInput, QuotePage, QuoteStatus } from "./types";

type ListParams = {
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  status?: QuoteStatus | "";
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
};

export function listQuotes(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.customerId) {
    searchParams.set("customerId", params.customerId);
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

  return apiRequest<QuotePage>(`/quotes?${searchParams.toString()}`, { token });
}

export function getQuote(token: string, id: string) {
  return apiRequest<Quote>(`/quotes/${id}`, { token });
}

export function createQuote(token: string, input: QuoteInput) {
  return apiRequest<Quote>("/quotes", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updateQuote(token: string, id: string, input: QuoteInput) {
  return apiRequest<Quote>(`/quotes/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  });
}

export function deleteQuote(token: string, id: string) {
  return apiRequest<void>(`/quotes/${id}`, {
    method: "DELETE",
    token,
  });
}

export function sendQuote(token: string, id: string) {
  return apiRequest<Quote>(`/quotes/${id}/send`, {
    method: "POST",
    token,
  });
}

export function approveQuote(token: string, id: string) {
  return apiRequest<Quote>(`/quotes/${id}/mark-customer-approved`, {
    method: "POST",
    token,
  });
}

export function completeQuote(token: string, id: string) {
  return apiRequest<Quote>(`/quotes/${id}/complete`, {
    method: "POST",
    token,
  });
}

export function rejectQuote(token: string, id: string) {
  return apiRequest<Quote>(`/quotes/${id}/reject`, {
    method: "POST",
    token,
  });
}

export function cancelQuote(token: string, id: string) {
  return apiRequest<Quote>(`/quotes/${id}/cancel`, {
    method: "POST",
    token,
  });
}

export function generatePublicQuoteLink(token: string, id: string) {
  return apiRequest<PublicQuoteLink>(`/quotes/${id}/public-token`, {
    method: "POST",
    token,
  });
}

export function privateQuotePdfUrl(id: string) {
  return `${env.apiUrl}/quotes/${id}/pdf`;
}

export function getPublicQuote(token: string) {
  return apiRequest<PublicQuote>(`/public/quotes/${token}`);
}

export function approvePublicQuote(token: string) {
  return apiRequest<PublicQuote>(`/public/quotes/${token}/approve`, {
    method: "POST",
  });
}

export function rejectPublicQuote(token: string, reason?: string) {
  return apiRequest<PublicQuote>(`/public/quotes/${token}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  });
}

export function publicQuotePdfUrl(token: string) {
  return `${env.apiUrl}/public/quotes/${token}/pdf`;
}
