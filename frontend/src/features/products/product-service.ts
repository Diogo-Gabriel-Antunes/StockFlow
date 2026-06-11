import { apiRequest } from "@/services/http";
import type { Product, ProductInput, ProductPage } from "./types";

type ListParams = {
  active?: boolean;
  lowStock?: boolean;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
};

export function listProducts(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.active !== undefined) {
    searchParams.set("active", String(params.active));
  }
  if (params.lowStock !== undefined) {
    searchParams.set("lowStock", String(params.lowStock));
  }
  if (params.sort) {
    searchParams.set("sort", params.sort);
  }
  if (params.direction) {
    searchParams.set("direction", params.direction);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 10));

  return apiRequest<ProductPage>(`/products?${searchParams.toString()}`, { token });
}

export function getProduct(token: string, id: string) {
  return apiRequest<Product>(`/products/${id}`, { token });
}

export function createProduct(token: string, input: ProductInput) {
  return apiRequest<Product>("/products", {
    method: "POST",
    token,
    body: JSON.stringify(input),
  });
}

export function updateProduct(token: string, id: string, input: ProductInput) {
  return apiRequest<Product>(`/products/${id}`, {
    method: "PUT",
    token,
    body: JSON.stringify(input),
  });
}

export function deleteProduct(token: string, id: string) {
  return apiRequest<void>(`/products/${id}`, {
    method: "DELETE",
    token,
  });
}
