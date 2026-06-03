import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  listReplenishmentProducts,
  registerReplenishmentEntry,
} from "./replenishment-service";
import { ReplenishmentsPage } from "./replenishments-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/stock/low",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./replenishment-service", () => ({
  listReplenishmentProducts: vi.fn(),
  registerReplenishmentEntry: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReplenishmentsPage />
    </QueryClientProvider>,
  );
}

describe("ReplenishmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listReplenishmentProducts).mockResolvedValue([
      {
        id: "product-1",
        name: "Produto Critico",
        sku: "REP-001",
        category: "Teste",
        unit: "UN",
        stockQuantity: 1,
        minimumStock: 5,
        suggestedPurchaseQuantity: 4,
      },
    ]);
    vi.mocked(registerReplenishmentEntry).mockResolvedValue({
      replenishmentId: "replenishment-1",
      movement: {
        id: "movement-1",
        companyId: "company-1",
        productId: "product-1",
        productName: "Produto Critico",
        productSku: "REP-001",
        type: "IN",
        quantity: 4,
        previousQuantity: 1,
        newQuantity: 5,
        reason: "Reposicao / compra",
        referenceType: "REPLENISHMENT",
        referenceId: "replenishment-1",
        createdBy: "user-1",
        createdAt: "2026-06-03T00:00:00Z",
      },
    });
  });

  test("renders critical products and registers replenishment entry", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Produto Critico")).toBeInTheDocument();
    expect(screen.getByText("4 UN")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Quantidade para Produto Critico"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Registrar" }));

    await waitFor(() => {
      expect(registerReplenishmentEntry).toHaveBeenCalledWith("token-test", {
        productId: "product-1",
        quantity: 6,
        reason: "Reposicao / compra",
      });
    });
  });
});
