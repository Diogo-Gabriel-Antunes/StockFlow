import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { approvePublicQuote, getPublicQuote, rejectPublicQuote } from "./quote-service";
import { PublicQuotePage } from "./public-quote-page";

vi.mock("./quote-service", () => ({
  getPublicQuote: vi.fn(),
  approvePublicQuote: vi.fn(),
  rejectPublicQuote: vi.fn(),
  publicQuotePdfUrl: (token: string) => `/api/public/quotes/${token}/pdf`,
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
      companyDocument: "12.345.678/0001-90",
      companyEmail: "admin@stockflow.local",
      companyPhone: "(47) 3333-3333",
      companyWhatsapp: "(47) 99999-9999",
      companyCity: "Joinville",
      companyState: "SC",
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
      customerApprovedAt: null,
      customerRejectedAt: null,
      completedAt: null,
      completedBy: null,
      stockDeducted: false,
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
    vi.mocked(approvePublicQuote).mockResolvedValue({ ...quote, status: "CUSTOMER_APPROVED" });
    vi.mocked(rejectPublicQuote).mockResolvedValue({ ...quote, status: "REJECTED" });
  });

  test("renders public quote and approves it", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Proposta Q-001")).toBeInTheDocument();
    expect(screen.getByText(/12\.345\.678\/0001-90/)).toBeInTheDocument();
    expect(screen.getByText(/Joinville\/SC/)).toBeInTheDocument();
    expect(screen.getByText("Produto Teste")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Baixar PDF" })).toHaveAttribute(
      "href",
      "/api/public/quotes/public-token/pdf",
    );

    fireEvent.click(screen.getByRole("button", { name: "Aprovar proposta" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Aprovar proposta" }).at(-1)!);

    await waitFor(() => {
      expect(approvePublicQuote).toHaveBeenCalledWith("public-token");
    });
  });

  test("rejects with optional reason", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Proposta Q-001")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Recusar proposta" }));
    fireEvent.change(screen.getByPlaceholderText("Motivo da recusa, opcional"), {
      target: { value: "Valor acima do orçamento" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar recusa" }));

    await waitFor(() => {
      expect(rejectPublicQuote).toHaveBeenCalledWith("public-token", "Valor acima do orçamento");
    });
  });

  test("renders invalid link state", async () => {
    vi.mocked(getPublicQuote).mockRejectedValue(new Error("expired"));

    renderWithQueryClient();

    expect(await screen.findByText("Link inválido ou expirado.")).toBeInTheDocument();
  });
});
