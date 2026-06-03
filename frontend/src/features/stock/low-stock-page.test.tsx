import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { LowStockPage } from "./low-stock-page";
import { listLowStockProducts } from "./stock-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/stock/low",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./stock-service", () => ({
  listLowStockProducts: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LowStockPage />
    </QueryClientProvider>,
  );
}

describe("LowStockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listLowStockProducts).mockResolvedValue([
      {
        id: "product-1",
        name: "Produto Baixo",
        sku: "LOW-001",
        category: "Teste",
        unit: "UN",
        stockQuantity: 1,
        minimumStock: 3,
        suggestedPurchaseQuantity: 2,
      },
    ]);
  });

  test("renders low stock products", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Produto Baixo")).toBeInTheDocument();
    expect(screen.getByText("LOW-001")).toBeInTheDocument();
    expect(listLowStockProducts).toHaveBeenCalledWith("token-test");
  });
});
