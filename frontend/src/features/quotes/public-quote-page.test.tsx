import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { approvePublicQuote, getPublicQuote, rejectPublicQuote } from "./quote-service";
import { PublicQuotePage } from "./public-quote-page";

vi.mock("./quote-service", () => ({
  getPublicQuote: vi.fn(),
  approvePublicQuote: vi.fn(),
  rejectPublicQuote: vi.fn(),
  publicQuotePdfUrl: (token: string) => `http://localhost:8080/public/quotes/${token}/pdf`,
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <PublicQuotePage token="public-token" />
    </QueryClientProvider>,
  );
}

describe("PublicQuotePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const quote = {
      companyName: "StockFlow Demo",
      companyEmail: "admin@stockflow.local",
      customerName: "Cliente Teste",
      code: "Q-001",
      status: "SENT" as const,
      validUntil: "2026-06-10",
      subtotal: 100,
      discount: 10,
      shipping: 5,
      total: 95,
      notes: "Observacao",
      paymentTerms: "Pix",
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
    vi.mocked(getPublicQuote).mockResolvedValue(quote);
    vi.mocked(approvePublicQuote).mockResolvedValue({ ...quote, status: "APPROVED" });
    vi.mocked(rejectPublicQuote).mockResolvedValue({ ...quote, status: "REJECTED" });
  });

  test("renders public quote and approves it", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Proposta Q-001")).toBeInTheDocument();
    expect(screen.getByText("Produto Teste")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Aprovar proposta" }));

    await waitFor(() => {
      expect(approvePublicQuote).toHaveBeenCalledWith("public-token");
    });
  });

  test("renders invalid link state", async () => {
    vi.mocked(getPublicQuote).mockRejectedValue(new Error("expired"));

    renderWithQueryClient();

    expect(await screen.findByText("Link inválido ou expirado.")).toBeInTheDocument();
  });
});
