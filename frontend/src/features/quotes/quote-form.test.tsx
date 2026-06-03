import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { listCustomers } from "@/features/customers/customer-service";
import { listProducts } from "@/features/products/product-service";
import { listServiceItems } from "@/features/services/service-item-service";
import { createQuote } from "./quote-service";
import { QuoteForm } from "./quote-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
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

vi.mock("./quote-service", () => ({
  createQuote: vi.fn(),
  updateQuote: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <QuoteForm />
    </QueryClientProvider>,
  );
}

describe("QuoteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCustomers).mockResolvedValue({
      items: [
        {
          id: "customer-1",
          companyId: "company-1",
          name: "Cliente Teste",
          type: "COMPANY",
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
          costPrice: 10,
          salePrice: 25,
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
    vi.mocked(listServiceItems).mockResolvedValue({
      items: [],
      page: 0,
      size: 100,
      total: 0,
    });
    vi.mocked(createQuote).mockResolvedValue({
      id: "quote-1",
      companyId: "company-1",
      customerId: "customer-1",
      customerName: "Cliente Teste",
      code: "Q-001",
      status: "DRAFT",
      validUntil: null,
      subtotal: 45,
      discount: 2,
      shipping: 7,
      total: 50,
      notes: null,
      paymentTerms: null,
      createdBy: "user-1",
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
      items: [],
    });
  });

  test("creates quote and shows preliminary total", async () => {
    renderWithQueryClient();

    fireEvent.change(await screen.findByLabelText("Cliente"), {
      target: { value: "customer-1" },
    });
    fireEvent.change(screen.getByLabelText("Produto"), {
      target: { value: "product-1" },
    });
    fireEvent.change(screen.getByLabelText("Quantidade"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Desconto do item"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Desconto geral"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Frete"), {
      target: { value: "7" },
    });

    expect(screen.getByText("R$ 50,00")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salvar orçamento" }));

    await waitFor(() => {
      expect(createQuote).toHaveBeenCalledWith("token-test", {
        customerId: "customer-1",
        validUntil: undefined,
        discount: 2,
        shipping: 7,
        notes: undefined,
        paymentTerms: undefined,
        items: [
          {
            itemType: "PRODUCT",
            productId: "product-1",
            serviceId: undefined,
            description: "Produto Teste",
            quantity: 2,
            unitPrice: 25,
            discount: 5,
          },
        ],
      });
    });
  });
});
