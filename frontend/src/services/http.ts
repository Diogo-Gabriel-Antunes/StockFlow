import { env } from "@/lib/env";
import { clearToken } from "@/features/auth/auth-storage";
import { appToast } from "@/lib/toast";

type RequestOptions = RequestInit & {
  token?: string;
};

export class SessionExpiredError extends Error {
  constructor(message = "Sua sessão expirou. Faça login novamente.") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

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

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...options,
    headers: requestHeaders,
  });

  if (response.status === 401 && shouldHandleUnauthorized(path)) {
    handleUnauthorized();
    throw new SessionExpiredError();
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

function shouldHandleUnauthorized(path: string) {
  return !path.startsWith("/auth/login")
    && !path.startsWith("/auth/register")
    && !path.startsWith("/public/");
}

function handleUnauthorized() {
  if (typeof window === "undefined") {
    return;
  }
  clearToken();
  window.sessionStorage.setItem(
    "stockflow_session_message",
    "Sua sessão expirou. Faça login novamente.",
  );
  appToast.warning("Sua sessão expirou. Faça login novamente.");
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}
