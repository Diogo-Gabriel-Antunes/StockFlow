import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { listProducts } from "@/features/products/product-service";
import { appToast } from "@/lib/toast";
import { StockPage } from "./stock-page";
import {
  createStockEntry,
  createStockAdjustment,
  createStockOutput,
  listStockMovements,
} from "./stock-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/stock",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("@/features/products/product-service", () => ({
  listProducts: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  appToast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error && error.message !== "failed" ? error.message : fallback,
}));

vi.mock("./stock-service", () => ({
  listStockMovements: vi.fn(),
  listLowStockProducts: vi.fn(),
  createStockEntry: vi.fn(),
  createStockOutput: vi.fn(),
  createStockAdjustment: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StockPage />
    </QueryClientProvider>,
  );
}

describe("StockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const createdMovement = {
      id: "movement-2",
      companyId: "company-1",
      productId: "product-1",
      productName: "Produto Teste",
      productSku: "P-001",
      type: "IN" as const,
      quantity: 1,
      previousQuantity: 5,
      newQuantity: 6,
      reason: "Reposicao",
      referenceType: null,
      referenceId: null,
      createdBy: "user-1",
      createdByName: "Ana Estoque",
      createdAt: "2026-06-03T00:00:00Z",
    };

    vi.mocked(listProducts).mockResolvedValue({
      items: [
        {
          id: "product-1",
          companyId: "company-1",
          name: "Produto Teste",
          sku: "P-001",
          category: "Teste",
          barcode: null,
          referenceCode: null,
          costPrice: 10,
          salePrice: 20,
          unit: "UN",
          stockQuantity: 5,
          minimumStock: 2,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 100,
      total: 1,
    });
    vi.mocked(listStockMovements).mockResolvedValue({
      items: [
        {
          id: "movement-1",
          companyId: "company-1",
          productId: "product-1",
          productName: "Produto Teste",
          productSku: "P-001",
          type: "IN",
          quantity: 2,
          previousQuantity: 3,
          newQuantity: 5,
          reason: "Entrada inicial",
          referenceType: null,
          referenceId: null,
          createdBy: "user-1",
          createdByName: "Ana Estoque",
          createdAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 10,
      total: 1,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(createStockEntry).mockResolvedValue(createdMovement);
    vi.mocked(createStockOutput).mockResolvedValue({ ...createdMovement, type: "OUT" });
    vi.mocked(createStockAdjustment).mockResolvedValue({
      ...createdMovement,
      type: "ADJUSTMENT",
    });
  });

  test("renders movement history and records an entry", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Entrada inicial")).toBeInTheDocument();
    expect(screen.getAllByText("Produto Teste").length).toBeGreaterThan(0);
    expect(screen.getByText("Ana Estoque")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Produto"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Motivo"), {
      target: { value: "Reposicao" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar movimentação" }));

    await waitFor(() => {
      expect(createStockEntry).toHaveBeenCalledWith("token-test", {
        productId: "product-1",
        quantity: 3,
        reason: "Reposicao",
      });
    });
    expect(await screen.findByText("Movimentação registrada com sucesso.")).toBeInTheDocument();
    expect(appToast.success).toHaveBeenCalledWith("Movimentação registrada com sucesso.");
  });

  test("shows empty state when there are no stock movements", async () => {
    vi.mocked(listStockMovements).mockResolvedValue({
      items: [],
      page: 0,
      size: 10,
      total: 0,
      totalElements: 0,
      totalPages: 0,
    });

    renderWithQueryClient();

    expect(
      await screen.findByText("Nenhuma movimentação de estoque registrada."),
    ).toBeInTheDocument();
  });

  test("uses product movement history when a product is selected", async () => {
    renderWithQueryClient();

    fireEvent.change(await screen.findByLabelText("Produto"), {
      target: { value: "product-1" },
    });

    await waitFor(() => {
      expect(listStockMovements).toHaveBeenLastCalledWith("token-test", {
        dateFrom: "",
        dateTo: "",
        page: 0,
        productId: "product-1",
        search: "",
        size: 10,
        type: "",
      });
    });
  });

  test("records output and shows insufficient stock errors", async () => {
    vi.mocked(createStockOutput).mockRejectedValue(
      new Error("Estoque insuficiente para realizar a saída."),
    );
    renderWithQueryClient();

    fireEvent.change(await screen.findByLabelText("Produto"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "OUT" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar movimentação" }));

    await waitFor(() => {
      expect(createStockOutput).toHaveBeenCalledWith("token-test", {
        productId: "product-1",
        quantity: 10,
        reason: "",
      });
    });
    expect(
      await screen.findByText("Estoque insuficiente para realizar a saída."),
    ).toBeInTheDocument();
    expect(appToast.warning).toHaveBeenCalledWith("Estoque insuficiente para realizar a saída.");
  });

  test("records an adjustment with zero quantity", async () => {
    renderWithQueryClient();

    fireEvent.change(await screen.findByLabelText("Produto"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "ADJUSTMENT" },
    });
    fireEvent.change(screen.getByLabelText("Novo estoque"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar movimentação" }));

    await waitFor(() => {
      expect(createStockAdjustment).toHaveBeenCalledWith("token-test", {
        productId: "product-1",
        newQuantity: 0,
        reason: "",
      });
    });
  });

  test("validates product selection", async () => {
    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar movimentação" }));

    expect(await screen.findByText("Produto é obrigatório.")).toBeInTheDocument();
    expect(createStockEntry).not.toHaveBeenCalled();
  });

  test("validates positive quantity for entry and output", async () => {
    renderWithQueryClient();

    fireEvent.change(await screen.findByLabelText("Produto"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar movimentação" }));

    expect(await screen.findByText("Informe um valor maior que zero.")).toBeInTheDocument();
    expect(createStockEntry).not.toHaveBeenCalled();
  });

  test("validates non-negative adjustment quantity", async () => {
    renderWithQueryClient();

    fireEvent.change(await screen.findByLabelText("Produto"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Tipo"), {
      target: { value: "ADJUSTMENT" },
    });
    fireEvent.change(screen.getByLabelText("Novo estoque"), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar movimentação" }));

    expect(
      await screen.findByText("Informe um valor maior ou igual a zero."),
    ).toBeInTheDocument();
    expect(createStockAdjustment).not.toHaveBeenCalled();
  });
});
