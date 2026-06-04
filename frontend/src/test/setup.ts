import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("@/features/auth/auth-service", () => ({
  getMe: vi.fn(async () => ({
    user: {
      id: "user-1",
      companyId: "company-1",
      name: "Owner",
      email: "owner@stockflow.test",
      role: "OWNER",
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    },
    company: {
      id: "company-1",
      name: "Empresa Teste",
      document: null,
      email: null,
      phone: null,
      logoUrl: null,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    },
  })),
}));

Object.defineProperty(window, "confirm", {
  writable: true,
  value: vi.fn(() => true),
});
