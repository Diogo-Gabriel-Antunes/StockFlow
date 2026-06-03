"use client";

const TOKEN_KEY = "stockflow_token";
const COOKIE_NAME = "stockflow_token";
const COOKIE_MAX_AGE_SECONDS = 60 * 60;

export function getToken() {
  const token = window.localStorage.getItem(TOKEN_KEY);
  console.log("[auth] token read from localStorage", token);
  return token;
}

export function storeToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  console.log("[auth] token saved", token);
}

export function clearToken() {
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
  console.log("[auth] token cleared");
}
