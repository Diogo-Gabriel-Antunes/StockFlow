import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  approveQuote,
  cancelQuote,
  completeQuote,
  generatePublicQuoteLink,
  getQuote,
  rejectQuote,
  sendQuote,
} from "./quote-service";
import { QuoteDetailPage } from "./quote-detail-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/quotes/quote-1",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./quote-service", () => ({
  getQuote: vi.fn(),
  sendQuote: vi.fn(),
  approveQuote: vi.fn(),
  cancelQuote: vi.fn(),
  completeQuote: vi.fn(),
  rejectQuote: vi.fn(),
  generatePublicQuoteLink: vi.fn(),
  privateQuotePdfUrl: (id: string) => `/api/quotes/${id}/pdf`,
  publicQuotePdfUrl: (token: string) => `/api/public/quotes/${token}/pdf`,
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <QuoteDetailPage id="quote-1" />
    </QueryClientProvider>,
  );
}

function quoteFixture(status: "DRAFT" | "SENT" | "CUSTOMER_APPROVED" | "COMPLETED" = "DRAFT") {
  return {
    id: "quote-1",
    companyId: "company-1",
    customerId: "customer-1",
    customerName: "Cliente Teste",
    code: "Q-001",
    status,
    validUntil: null,
    subtotal: 100,
    discount: 10,
    shipping: 5,
    total: 95,
    notes: null,
    paymentTerms: null,
    createdBy: "user-1",
    customerApprovedAt: status === "CUSTOMER_APPROVED" ? "2026-06-03T00:30:00Z" : null,
    customerRejectedAt: null,
    completedAt: status === "COMPLETED" ? "2026-06-03T01:00:00Z" : null,
    completedBy: status === "COMPLETED" ? "user-1" : null,
    stockDeducted: status === "COMPLETED",
    createdAt: "2026-06-03T00:00:00Z",
    updatedAt: "2026-06-03T00:00:00Z",
    items: [
      {
        id: "item-1",
        itemType: "PRODUCT" as const,
        productId: "product-1",
        serviceId: null,
        description: "Produto Teste",
        quantity: 2,
        unitPrice: 50,
        discount: 0,
        total: 100,
      },
    ],
  };
}

describe("QuoteDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const quote = quoteFixture();
    vi.mocked(getQuote).mockResolvedValue(quote);
    vi.mocked(sendQuote).mockResolvedValue({ ...quote, status: "SENT" });
    vi.mocked(approveQuote).mockResolvedValue({ ...quote, status: "CUSTOMER_APPROVED" });
    vi.mocked(completeQuote).mockResolvedValue({
      ...quote,
      status: "COMPLETED",
      stockDeducted: true,
      completedAt: "2026-06-03T01:00:00Z",
      completedBy: "user-1",
    });
    vi.mocked(rejectQuote).mockResolvedValue({ ...quote, status: "REJECTED" });
    vi.mocked(cancelQuote).mockResolvedValue({ ...quote, status: "CANCELLED" });
    vi.mocked(generatePublicQuoteLink).mockResolvedValue({
      token: "public-token",
      url: "http://localhost:3000/public/quotes/public-token",
      expiresAt: "2026-06-10T00:00:00Z",
    });
  });

  test("renders details and sends quote", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Q-001")).toBeInTheDocument();
    expect(screen.getByText("Produto Teste")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar PDF" })).toHaveAttribute(
      "href",
      "/api/quotes/quote-1/pdf",
    );

    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(sendQuote).toHaveBeenCalledWith("token-test", "quote-1");
    });
  });

  test("generates public quote link", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Q-001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Gerar link público" }));

    expect(await screen.findByText("Link público da proposta")).toBeInTheDocument();
    expect(screen.getByText("http://localhost:3000/public/quotes/public-token")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "PDF" })).toHaveAttribute(
      "href",
      "/api/public/quotes/public-token/pdf",
    );
  });

  test("shows customer approval action only when quote is sent", async () => {
    vi.mocked(getQuote).mockResolvedValueOnce(quoteFixture("SENT"));

    renderWithQueryClient();

    expect(await screen.findByText("Q-001")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Marcar como aprovado pelo cliente" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Concluir orçamento" })).not.toBeInTheDocument();
  });

  test("opens confirmation dialog and completes customer approved quote", async () => {
    vi.mocked(getQuote).mockResolvedValueOnce(quoteFixture("CUSTOMER_APPROVED"));

    renderWithQueryClient();

    fireEvent.click(await screen.findByRole("button", { name: "Concluir orçamento" }));
    expect(screen.getByRole("dialog", { name: "Concluir orçamento" })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Concluir orçamento" }).at(-1)!);

    await waitFor(() => {
      expect(completeQuote).toHaveBeenCalledWith("token-test", "quote-1");
    });
  });
});
