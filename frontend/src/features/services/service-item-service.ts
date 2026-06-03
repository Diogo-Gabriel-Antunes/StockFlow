import { apiRequest } from "@/services/http";
import type { ServiceItem, ServiceItemInput, ServiceItemPage } from "./types";

type ListParams = {
  search?: string;
  page?: number;
  size?: number;
};

export function listServiceItems(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 20));

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
