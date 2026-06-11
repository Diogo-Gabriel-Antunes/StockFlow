import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getMe } from "@/features/auth/auth-service";
import { appToast } from "@/lib/toast";
import { getDashboardSummary } from "./dashboard-service";
import { DashboardPage } from "./dashboard-page";
import type { DashboardSummary } from "./types";

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

vi.mock("@/lib/toast", () => ({
  appToast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
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

function summaryFixture(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    period: { dateFrom: "2026-06-01", dateTo: "2026-06-30" },
    quotes: {
      total: 2,
      approvedByCustomer: 0,
      completed: 1,
      rejected: 0,
      cancelled: 0,
      open: 1,
      approvedAmount: 60,
      openAmount: 30,
      approvalRate: 50,
    },
    stock: {
      lowStockCount: 2,
      outOfStockCount: 1,
    },
    customers: {
      total: 3,
      createdInPeriod: 1,
    },
    recentQuotes: [
      {
        id: "quote-1",
        code: "Q-001",
        customerName: "Cliente Teste",
        status: "COMPLETED",
        total: 60,
        createdAt: "2026-06-03T00:00:00Z",
      },
    ],
    recentCustomers: [
      {
        id: "customer-1",
        name: "Cliente Teste",
        document: "12345678000199",
        email: "cliente@stockflow.test",
        phone: null,
        createdAt: "2026-06-03T00:00:00Z",
      },
    ],
    recentStockMovements: [
      {
        id: "movement-1",
        productName: "Produto Baixo",
        type: "IN",
        quantity: 4,
        previousQuantity: 1,
        newQuantity: 5,
        reason: "Reposição",
        createdAt: "2026-06-03T00:00:00Z",
      },
    ],
    criticalProducts: [
      {
        id: "product-1",
        name: "Produto Baixo",
        sku: "LOW-001",
        stockQuantity: 1,
        minimumStock: 5,
        status: "LOW_STOCK",
      },
    ],
    ...overrides,
  };
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
    vi.mocked(getDashboardSummary).mockResolvedValue(summaryFixture());
  });

  test("renders dashboard v2 cards and summaries", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Empresa Teste")).toBeInTheDocument();
    expect(screen.getByText("Orçamentos do período")).toBeInTheDocument();
    expect(screen.getByText("Valor aprovado")).toBeInTheDocument();
    expect(screen.getByText("Valor em aberto")).toBeInTheDocument();
    expect(screen.getByText("Taxa de aprovação")).toBeInTheDocument();
    expect(screen.getByText("Produtos sem estoque")).toBeInTheDocument();
    expect(screen.getByText("Clientes cadastrados")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 60,00").length).toBeGreaterThan(0);
    expect(screen.getByText("50%")).toBeInTheDocument();
    expect(screen.getByText("Q-001")).toBeInTheDocument();
    expect(screen.getAllByText("Cliente Teste")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Produto Baixo").length).toBeGreaterThan(0);
    expect(screen.getByText("Últimas movimentações")).toBeInTheDocument();
    expect(getDashboardSummary).toHaveBeenCalledWith("token-test", {
      period: "currentMonth",
    });
  });

  test("changing period calls API again", async () => {
    renderWithQueryClient();

    await screen.findByText("Orçamentos do período");
    fireEvent.change(screen.getByLabelText("Filtro"), {
      target: { value: "last7days" },
    });

    await waitFor(() => {
      expect(getDashboardSummary).toHaveBeenCalledWith("token-test", {
        period: "last7days",
      });
    });
  });

  test("applies custom period", async () => {
    renderWithQueryClient();

    await screen.findByText("Orçamentos do período");
    fireEvent.change(screen.getByLabelText("Filtro"), {
      target: { value: "custom" },
    });
    fireEvent.change(screen.getByLabelText("Data inicial"), {
      target: { value: "2026-06-01" },
    });
    fireEvent.change(screen.getByLabelText("Data final"), {
      target: { value: "2026-06-30" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtro" }));

    await waitFor(() => {
      expect(getDashboardSummary).toHaveBeenCalledWith("token-test", {
        period: "custom",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
      });
    });
  });

  test("shows loading state", async () => {
    vi.mocked(getDashboardSummary).mockReturnValue(new Promise(() => undefined));

    renderWithQueryClient();

    expect(await screen.findByText("Carregando dashboard...")).toBeInTheDocument();
  });

  test("shows a toast and non-blocking error message when summary fails", async () => {
    vi.mocked(getDashboardSummary).mockRejectedValue(new Error("failed"));

    renderWithQueryClient();

    expect(await screen.findByText("Empresa Teste")).toBeInTheDocument();
    expect(
      await screen.findByText("Não foi possível carregar o dashboard."),
    ).toBeInTheDocument();
    expect(appToast.error).toHaveBeenCalledWith("Não foi possível carregar o dashboard.");
  });

  test("renders empty states", async () => {
    vi.mocked(getDashboardSummary).mockResolvedValue(
      summaryFixture({
        recentQuotes: [],
        recentCustomers: [],
        recentStockMovements: [],
        criticalProducts: [],
      }),
    );

    renderWithQueryClient();

    expect(
      await screen.findByText("Nenhum orçamento encontrado no período."),
    ).toBeInTheDocument();
    expect(screen.getByText("Nenhum produto crítico no momento.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma movimentação recente.")).toBeInTheDocument();
    expect(screen.getByText("Nenhum cliente cadastrado recentemente.")).toBeInTheDocument();
  });
});
