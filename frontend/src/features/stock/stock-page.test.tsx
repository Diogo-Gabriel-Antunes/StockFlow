import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { listProducts } from "@/features/products/product-service";
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
          createdAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      total: 1,
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
  });

  test("validates product selection", async () => {
    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar movimentação" }));

    expect(await screen.findByText("Produto é obrigatório.")).toBeInTheDocument();
    expect(createStockEntry).not.toHaveBeenCalled();
  });
});
