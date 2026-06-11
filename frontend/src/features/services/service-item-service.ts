import { apiRequest } from "@/services/http";
import type { ServiceItem, ServiceItemInput, ServiceItemPage } from "./types";

type ListParams = {
  active?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
};

export function listServiceItems(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (params.direction) {
    searchParams.set("direction", params.direction);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));

  return apiRequest<ServiceItemPage>(`/services?${searchParams.toString()}`, { token });
}

export function getServiceItem(token: string, id: string) {
  return apiRequest<ServiceItem>(`/services/${id}`, { token });
}

export function createServiceItem(token: string, input: ServiceItemInput) {
  return apiRequest<ServiceItem>("/services", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updateServiceItem(token: string, id: string, input: ServiceItemInput) {
  return apiRequest<ServiceItem>(`/services/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  });
}

export function deleteServiceItem(token: string, id: string) {
  return apiRequest<void>(`/services/${id}`, {
    method: "DELETE",
    token,
  });
}
