import { beforeEach, describe, expect, test, vi } from "vitest";
import { clearToken } from "@/features/auth/auth-storage";
import { apiRequest, SessionExpiredError } from "./http";

vi.mock("@/features/auth/auth-storage", () => ({
  clearToken: vi.fn(),
}));

describe("apiRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    window.history.pushState(null, "", "/login");
  });

  test("clears session and throws friendly error on private 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 401 })),
    );

    await expect(apiRequest("/customers", { token: "token-test" })).rejects.toBeInstanceOf(
      SessionExpiredError,
    );

    expect(clearToken).toHaveBeenCalled();
    expect(window.sessionStorage.getItem("stockflow_session_message")).toBe(
      "Sua sessão expirou. Faça login novamente.",
    );
  });

  test("does not clear session for public quote 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Link inválido", { status: 401 })),
    );

    await expect(apiRequest("/public/quotes/token-test")).rejects.toThrow("Link inválido");
    expect(clearToken).not.toHaveBeenCalled();
  });
});
