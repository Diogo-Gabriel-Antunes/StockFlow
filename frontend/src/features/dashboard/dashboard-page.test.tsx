import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getMe } from "@/features/auth/auth-service";
import { getDashboardSummary } from "./dashboard-service";
import { DashboardPage } from "./dashboard-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("@/features/auth/auth-service", () => ({
  getMe: vi.fn(),
}));

vi.mock("./dashboard-service", () => ({
  getDashboardSummary: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DashboardPage />
    </QueryClientProvider>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getMe).mockResolvedValue({
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
    });
    vi.mocked(getDashboardSummary).mockResolvedValue({
      totalQuotesMonth: 2,
      approvedValueMonth: 60,
      openValue: 30,
      approvalRate: 50,
      lowStockProductCount: 1,
      lowStockProducts: [
        {
          id: "product-1",
          name: "Produto Baixo",
          sku: "LOW-001",
          unit: "UN",
          stockQuantity: 1,
          minimumStock: 5,
          suggestedPurchaseQuantity: 4,
        },
      ],
      recentQuotes: [
        {
          id: "quote-1",
          code: "Q-001",
          customerName: "Cliente Teste",
          status: "APPROVED",
          total: 60,
          createdAt: "2026-06-03T00:00:00Z",
        },
      ],
      recentCustomers: [
        {
          id: "customer-1",
          name: "Cliente Teste",
          email: "cliente@stockflow.test",
          phone: null,
          createdAt: "2026-06-03T00:00:00Z",
        },
      ],
    });
  });

  test("renders dashboard indicators and tables", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Empresa Teste")).toBeInTheDocument();
    expect(screen.getByText("Orçamentos do mês")).toBeInTheDocument();
    expect(screen.getByText("Valor aprovado no mês")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 60,00").length).toBeGreaterThan(0);
    expect(screen.getByText("50.00%")).toBeInTheDocument();
    expect(screen.getByText("Q-001")).toBeInTheDocument();
    expect(screen.getAllByText("Cliente Teste")[0]).toBeInTheDocument();
    expect(screen.getByText("Produto Baixo")).toBeInTheDocument();
    expect(screen.getByText("4 UN")).toBeInTheDocument();
    expect(getDashboardSummary).toHaveBeenCalledWith("token-test");
  });

  test("shows a non-blocking error message when summary fails", async () => {
    vi.mocked(getDashboardSummary).mockRejectedValue(new Error("failed"));

    renderWithQueryClient();

    expect(await screen.findByText("Empresa Teste")).toBeInTheDocument();
    expect(
      await screen.findByText("Não foi possível carregar os indicadores agora."),
    ).toBeInTheDocument();
  });
});
