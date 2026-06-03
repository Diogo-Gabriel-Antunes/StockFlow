import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { approveQuote, generatePublicQuoteLink, getQuote, rejectQuote, sendQuote } from "./quote-service";
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
  rejectQuote: vi.fn(),
  generatePublicQuoteLink: vi.fn(),
  publicQuotePdfUrl: (token: string) => `http://localhost:8080/public/quotes/${token}/pdf`,
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

describe("QuoteDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const quote = {
      id: "quote-1",
      companyId: "company-1",
      customerId: "customer-1",
      customerName: "Cliente Teste",
      code: "Q-001",
      status: "DRAFT" as const,
      validUntil: null,
      subtotal: 100,
      discount: 10,
      shipping: 5,
      total: 95,
      notes: null,
      paymentTerms: null,
      createdBy: "user-1",
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
    vi.mocked(getQuote).mockResolvedValue(quote);
    vi.mocked(sendQuote).mockResolvedValue({ ...quote, status: "SENT" });
    vi.mocked(approveQuote).mockResolvedValue({ ...quote, status: "APPROVED" });
    vi.mocked(rejectQuote).mockResolvedValue({ ...quote, status: "REJECTED" });
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
  });
});
