import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { listCustomers } from "@/features/customers/customer-service";
import { listProducts } from "@/features/products/product-service";
import { listServiceItems } from "@/features/services/service-item-service";
import { createQuote, deleteQuote, listQuotes, updateQuote } from "./quote-service";
import { QuotesPage } from "./quotes-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/quotes",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./quote-service", () => ({
  createQuote: vi.fn(),
  listQuotes: vi.fn(),
  deleteQuote: vi.fn(),
  updateQuote: vi.fn(),
}));

vi.mock("@/features/customers/customer-service", () => ({
  listCustomers: vi.fn(),
}));

vi.mock("@/features/products/product-service", () => ({
  listProducts: vi.fn(),
}));

vi.mock("@/features/services/service-item-service", () => ({
  listServiceItems: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <QuotesPage />
    </QueryClientProvider>,
  );
}

describe("QuotesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listQuotes).mockResolvedValue({
      items: [
        {
          id: "quote-1",
          companyId: "company-1",
          customerId: "customer-1",
          customerName: "Cliente Teste",
          code: "Q-001",
          status: "DRAFT",
          validUntil: null,
          subtotal: 100,
          discount: 10,
          shipping: 5,
          total: 95,
          notes: null,
          paymentTerms: null,
          createdBy: "user-1",
          customerApprovedAt: null,
          customerRejectedAt: null,
          completedAt: null,
          completedBy: null,
          stockDeducted: false,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
          items: [
            {
              id: "quote-item-1",
              itemType: "PRODUCT",
              productId: "product-1",
              serviceId: null,
              description: "Produto Teste",
              quantity: 1,
              unitPrice: 100,
              discount: 0,
              total: 100,
            },
          ],
        },
      ],
      page: 0,
      size: 10,
      total: 1,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(listCustomers).mockResolvedValue({
      items: [
        {
          id: "customer-1",
          companyId: "company-1",
          name: "Cliente Teste",
          type: "PERSON",
          document: null,
          email: null,
          phone: null,
          whatsapp: null,
          city: null,
          state: null,
          notes: null,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 100,
      total: 1,
    });
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
          salePrice: 100,
          unit: "UN",
          stockQuantity: 10,
          minimumStock: 1,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 100,
      total: 1,
    });
    vi.mocked(listServiceItems).mockResolvedValue({
      items: [
        {
          id: "service-1",
          companyId: "company-1",
          name: "Servico Teste",
          description: null,
          defaultPrice: 80,
          estimatedCost: 20,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 100,
      total: 1,
    });
    vi.mocked(createQuote).mockResolvedValue({
      id: "quote-2",
      companyId: "company-1",
      customerId: "customer-1",
      customerName: "Cliente Teste",
      code: "Q-002",
      status: "DRAFT",
      validUntil: null,
      subtotal: 100,
      discount: 0,
      shipping: 0,
      total: 100,
      notes: null,
      paymentTerms: null,
      createdBy: "user-1",
      customerApprovedAt: null,
      customerRejectedAt: null,
      completedAt: null,
      completedBy: null,
      stockDeducted: false,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
      items: [],
    });
    vi.mocked(updateQuote).mockResolvedValue({
      id: "quote-1",
      companyId: "company-1",
      customerId: "customer-1",
      customerName: "Cliente Teste",
      code: "Q-001",
      status: "DRAFT",
      validUntil: null,
      subtotal: 100,
      discount: 0,
      shipping: 0,
      total: 100,
      notes: null,
      paymentTerms: "Pix",
      createdBy: "user-1",
      customerApprovedAt: null,
      customerRejectedAt: null,
      completedAt: null,
      completedBy: null,
      stockDeducted: false,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
      items: [],
    });
    vi.mocked(deleteQuote).mockResolvedValue(undefined);
  });

  test("renders loaded quotes", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Q-001")).toBeInTheDocument();
    expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
    expect(screen.getAllByText("Rascunho").length).toBeGreaterThan(0);
    expect(listQuotes).toHaveBeenCalledWith("token-test", {
      dateFrom: "",
      dateTo: "",
      page: 0,
      search: "",
      size: 10,
      status: "",
    });
  });

  test("creates, edits, cancels and keeps modal open on error", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Q-001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo orçamento" }));
    expect(screen.getByRole("dialog", { name: "Novo orçamento" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(createQuote).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Novo orçamento" }));
    await screen.findByRole("option", { name: "Cliente Teste" });
    fireEvent.change(screen.getByLabelText("Cliente"), { target: { value: "customer-1" } });
    fireEvent.change(screen.getByLabelText("Produto"), { target: { value: "product-1" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar orçamento" }));

    await waitFor(() => expect(createQuote).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Novo orçamento" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Q-001" }));
    fireEvent.change(screen.getByLabelText("Condições de pagamento"), {
      target: { value: "Pix" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar orçamento" }));

    await waitFor(() => expect(updateQuote).toHaveBeenCalled());

    vi.mocked(updateQuote).mockRejectedValueOnce(new Error("failed"));
    fireEvent.click(screen.getByRole("button", { name: "Editar Q-001" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar orçamento" }));

    expect(await screen.findByText("Não foi possível salvar o orçamento.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar orçamento" })).toBeInTheDocument();
  });
});
