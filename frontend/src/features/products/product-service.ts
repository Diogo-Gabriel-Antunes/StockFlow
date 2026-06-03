import { apiRequest } from "@/services/http";
import type { Product, ProductInput, ProductPage } from "./types";

type ListParams = {
  search?: string;
  page?: number;
  size?: number;
};

export function listProducts(token: string, params: ListParams = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.set("search", params.search);
  }
  searchParams.set("page", String(params.page ?? 0));
  searchParams.set("size", String(params.size ?? 20));

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
