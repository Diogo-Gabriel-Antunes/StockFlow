import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { deleteQuote, listQuotes } from "./quote-service";
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
  listQuotes: vi.fn(),
  deleteQuote: vi.fn(),
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
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
          items: [],
        },
      ],
      page: 0,
      size: 20,
      total: 1,
    });
    vi.mocked(deleteQuote).mockResolvedValue(undefined);
  });

  test("renders loaded quotes", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Q-001")).toBeInTheDocument();
    expect(screen.getByText("Cliente Teste")).toBeInTheDocument();
    expect(screen.getAllByText("Rascunho").length).toBeGreaterThan(0);
    expect(listQuotes).toHaveBeenCalledWith("token-test", { status: "" });
  });
});
