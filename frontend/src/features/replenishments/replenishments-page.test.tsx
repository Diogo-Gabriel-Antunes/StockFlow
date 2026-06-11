import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { appToast } from "@/lib/toast";
import {
  listReplenishmentProducts,
  registerReplenishmentEntry,
} from "./replenishment-service";
import { ReplenishmentsPage } from "./replenishments-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/stock/replenishment",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./replenishment-service", () => ({
  listReplenishmentProducts: vi.fn(),
  registerReplenishmentEntry: vi.fn(),
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

const product = {
  id: "product-1",
  productId: "product-1",
  name: "Produto Critico",
  sku: "REP-001",
  barcode: "789",
  referenceCode: "REF-1",
  category: "Teste",
  unit: "UN",
  stockQuantity: 8,
  minimumStock: 20,
  suggestedQuantity: 12,
  suggestedPurchaseQuantity: 12,
  status: "LOW_STOCK" as const,
};

describe("ReplenishmentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listReplenishmentProducts).mockResolvedValue({
      items: [product],
      page: 0,
      size: 10,
      total: 1,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(registerReplenishmentEntry).mockResolvedValue({
      replenishmentId: "replenishment-1",
      movement: {
        id: "movement-1",
        companyId: "company-1",
        productId: "product-1",
        productName: "Produto Critico",
        productSku: "REP-001",
        type: "IN",
        quantity: 12,
        previousQuantity: 8,
        newQuantity: 20,
        reason: "Reposição de estoque",
        referenceType: "REPLENISHMENT",
        referenceId: "replenishment-1",
        createdBy: "user-1",
        createdAt: "2026-06-03T00:00:00Z",
      },
    });
  });

  test("renders loading and replenishment products", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Produto Critico")).toBeInTheDocument();
    expect(screen.getByText("REP-001")).toBeInTheDocument();
    expect(screen.getByText("Barras: 789")).toBeInTheDocument();
    expect(screen.getByText("Ref.: REF-1")).toBeInTheDocument();
    expect(screen.getByText("12 UN")).toBeInTheDocument();
  });

  test("renders empty state", async () => {
    vi.mocked(listReplenishmentProducts).mockResolvedValueOnce({
      items: [],
      page: 0,
      size: 10,
      total: 0,
      totalElements: 0,
      totalPages: 0,
    });

    renderWithQueryClient();

    expect(await screen.findByText("Nenhum produto precisa de reposição no momento")).toBeInTheDocument();
  });

  test("renders error state", async () => {
    vi.mocked(listReplenishmentProducts).mockRejectedValueOnce(new Error("failed"));

    renderWithQueryClient();

    expect(await screen.findByText("Não foi possível carregar os produtos para reposição.")).toBeInTheDocument();
  });

  test("opens modal with suggested quantity and registers replenishment", async () => {
    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar reposição" }));

    expect(screen.getByRole("dialog", { name: "Registrar reposição: Produto Critico" })).toBeInTheDocument();
    expect(screen.getByLabelText("Quantidade a repor")).toHaveValue(12);

    fireEvent.click(screen.getByRole("button", { name: "Confirmar reposição" }));

    await waitFor(() => {
      expect(registerReplenishmentEntry).toHaveBeenCalledWith("token-test", {
        productId: "product-1",
        quantity: 12,
        reason: "Reposição de estoque",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Registrar reposição: Produto Critico" })).not.toBeInTheDocument();
    });
    expect(appToast.success).toHaveBeenCalledWith("Reposição registrada com sucesso.");
    await waitFor(() => {
      expect(listReplenishmentProducts).toHaveBeenCalledTimes(2);
    });
  });

  test("validates quantity greater than zero", async () => {
    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar reposição" }));
    fireEvent.change(screen.getByLabelText("Quantidade a repor"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar reposição" }));

    expect(screen.getByText("Informe uma quantidade maior que zero.")).toBeInTheDocument();
    expect(registerReplenishmentEntry).not.toHaveBeenCalled();
    expect(appToast.warning).toHaveBeenCalledWith("Informe uma quantidade maior que zero.");
  });

  test("keeps modal open and shows toast on submit error", async () => {
    vi.mocked(registerReplenishmentEntry).mockRejectedValueOnce(new Error("failed"));
    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar reposição" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar reposição" }));

    await waitFor(() => {
      expect(registerReplenishmentEntry).toHaveBeenCalled();
    });
    expect(screen.getByRole("dialog", { name: "Registrar reposição: Produto Critico" })).toBeInTheDocument();
    expect(appToast.error).toHaveBeenCalledWith("Não foi possível registrar a reposição.");
  });

  test("disables modal actions and shows loading text while submitting", async () => {
    let resolveSubmit: () => void = () => undefined;
    vi.mocked(registerReplenishmentEntry).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSubmit = () =>
          resolve({
            replenishmentId: "replenishment-1",
            movement: {
              id: "movement-1",
              companyId: "company-1",
              productId: "product-1",
              productName: "Produto Critico",
              productSku: "REP-001",
              type: "IN",
              quantity: 12,
              previousQuantity: 8,
              newQuantity: 20,
              reason: "Reposição de estoque",
              referenceType: "REPLENISHMENT",
              referenceId: "replenishment-1",
              createdBy: "user-1",
              createdAt: "2026-06-03T00:00:00Z",
            },
          });
      }),
    );
    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar reposição" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar reposição" }));

    expect(await screen.findByRole("button", { name: "Registrando..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    resolveSubmit();
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Registrar reposição: Produto Critico" })).not.toBeInTheDocument();
    });
  });

  test("does not use browser alerts or confirms", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    const confirmSpy = vi.spyOn(window, "confirm").mockImplementation(() => true);

    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Registrar reposição" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar reposição" }));

    await waitFor(() => {
      expect(registerReplenishmentEntry).toHaveBeenCalled();
    });
    expect(alertSpy).not.toHaveBeenCalled();
    expect(confirmSpy).not.toHaveBeenCalled();
  });
});
