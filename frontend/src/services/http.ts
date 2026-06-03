import { env } from "@/lib/env";

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiRequest<T>(
  path: string,
  { token, headers, ...options }: RequestOptions = {},
): Promise<T> {
  const authorization = token ? `Bearer ${token}` : undefined;
  const requestHeaders = {
    "Content-Type": "application/json",
    ...(authorization ? { Authorization: authorization } : {}),
    ...headers,
  };

  if (path === "/auth/me") {
    console.log("[auth] GET /auth/me Authorization header", requestHeaders.Authorization);
  }

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers: requestHeaders,
  });

  if (path === "/auth/me") {
    console.log("[auth] GET /auth/me status", response.status);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
