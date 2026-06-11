import { apiRequest } from "@/services/http";
import type { Customer, CustomerInput, CustomerPage } from "./types";

type ListParams = {
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
};

export function listCustomers(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (params.direction) {
    searchParams.set("direction", params.direction);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));

  return apiRequest<CustomerPage>(`/customers?${searchParams.toString()}`, { token });
}

export function getCustomer(token: string, id: string) {
  return apiRequest<Customer>(`/customers/${id}`, { token });
}

export function createCustomer(token: string, input: CustomerInput) {
  return apiRequest<Customer>("/customers", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updateCustomer(token: string, id: string, input: CustomerInput) {
  return apiRequest<Customer>(`/customers/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  });
}

export function deleteCustomer(token: string, id: string) {
  return apiRequest<void>(`/customers/${id}`, {
    method: "DELETE",
    token,
  });
}
