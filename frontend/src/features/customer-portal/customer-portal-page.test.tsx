import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CustomerPortalPage } from "./customer-portal-page";
import { CustomerPortalRequestFormPage } from "./customer-portal-request-form-page";
import {
  approvePortalQuote,
  createPortalQuoteRequest,
  getCustomerPortal,
  getPortalProduct,
  listPortalQuoteRequests,
  listPortalQuotes,
  searchPortalProducts,
} from "./customer-portal-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("./customer-portal-service", () => ({
  approvePortalQuote: vi.fn(),
  cancelPortalQuoteRequest: vi.fn(),
  createPortalQuoteRequest: vi.fn(),
  getCustomerPortal: vi.fn(),
  getPortalProduct: vi.fn(),
  getPortalQuoteRequest: vi.fn(),
  listPortalQuoteRequests: vi.fn(),
  listPortalQuotes: vi.fn(),
  portalQuotePdfUrl: (token: string, quoteId: string) =>
    `/api/public/customer-portal/${token}/quotes/${quoteId}/pdf`,
  rejectPortalQuote: vi.fn(),
  searchPortalProducts: vi.fn(),
  updatePortalQuoteRequest: vi.fn(),
}));

function renderWithQueryClient(children: React.ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
}

describe("CustomerPortalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCustomerPortal).mockResolvedValue({
      customer: {
        id: "customer-1",
        name: "Cliente Portal",
        document: "000.000.000-00",
        email: "cliente@test.local",
        phone: "(47) 99999-9999",
      },
      company: {
        tradeName: "Empresa Portal",
        document: "12.345.678/0001-90",
        email: "contato@test.local",
        phone: "(47) 3333-3333",
        whatsapp: "(47) 98888-8888",
        city: "Joinville",
        state: "SC",
      },
      summary: { completedQuotes: 1, openQuotes: 1, quoteRequests: 1 },
    });
    vi.mocked(listPortalQuotes).mockImplementation((_token, statusGroup) =>
      Promise.resolve({
        content: statusGroup === "open"
          ? [{
              id: "quote-1",
              code: "Q-001",
              status: "SENT",
              statusLabel: "Aguardando aprovação",
              total: 100,
              createdAt: "2026-06-01T10:00:00Z",
              validUntil: "2026-06-10",
              canApprove: true,
              canReject: true,
              canDownloadPdf: true,
              subtotal: 100,
              discount: 0,
              shipping: 0,
              notes: null,
              paymentTerms: null,
              items: [],
            }]
          : [],
        first: true,
        last: true,
        page: 0,
        size: 10,
        totalElements: statusGroup === "open" ? 1 : 0,
        totalPages: statusGroup === "open" ? 1 : 0,
      }),
    );
    vi.mocked(listPortalQuoteRequests).mockResolvedValue([
      {
        id: "request-1",
        customerId: "customer-1",
        customerName: "Cliente Portal",
        title: "Nova demanda",
        description: "Preciso de orçamento",
        status: "REQUESTED",
        convertedQuoteId: null,
        convertedQuoteCode: null,
        createdAt: "2026-06-01T10:00:00Z",
        updatedAt: "2026-06-01T10:00:00Z",
        cancelledAt: null,
        convertedAt: null,
        canEdit: true,
        canCancel: true,
        items: [],
      },
    ]);
    vi.mocked(approvePortalQuote).mockResolvedValue({} as never);
    vi.mocked(createPortalQuoteRequest).mockResolvedValue({} as never);
    vi.mocked(getPortalProduct).mockResolvedValue({} as never);
    vi.mocked(searchPortalProducts).mockResolvedValue([]);
  });

  test("renders portal data and quote sections", async () => {
    renderWithQueryClient(<CustomerPortalPage token="portal-token" />);

    expect(await screen.findByText("Portal do Cliente")).toBeInTheDocument();
    expect(screen.getByText(/Cliente Portal/)).toBeInTheDocument();
    expect(screen.getByText("Q-001")).toBeInTheDocument();
    expect(screen.getByText("Nova demanda")).toBeInTheDocument();
  });

  test("approves quote through portal endpoint", async () => {
    renderWithQueryClient(<CustomerPortalPage token="portal-token" />);

    expect(await screen.findByText("Q-001")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aprovar" }));
    fireEvent.click(screen.getByRole("button", { name: "Aprovar proposta" }));

    await waitFor(() => {
      expect(approvePortalQuote).toHaveBeenCalledWith("portal-token", "quote-1");
    });
  });
});

describe("CustomerPortalRequestFormPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createPortalQuoteRequest).mockResolvedValue({} as never);
    vi.mocked(getPortalProduct).mockResolvedValue({
      id: "product-1",
      name: "Bandana M",
      description: "Bandana para pet",
      sku: "BAND-M",
      referenceCode: "REF-001",
      imageUrl: null,
    });
    vi.mocked(searchPortalProducts).mockResolvedValue([]);
  });

  test("validates and sends new quote request", async () => {
    renderWithQueryClient(<CustomerPortalRequestFormPage token="portal-token" />);

    expect(screen.getByText("Dados da solicitação")).toBeInTheDocument();
    expect(screen.getByText("Resumo")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Observação geral")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Observações sobre este item, se houver...")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Salvar solicitação" }));
    expect(await screen.findByText("Informe o título da solicitação.")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ex: Pedido de reposição para loja"), { target: { value: "Uniformes" } });
    fireEvent.change(
      screen.getByPlaceholderText("Descreva detalhes importantes, prazos, preferências ou qualquer observação sobre esta solicitação."),
      { target: { value: "Cores variadas para entrega na próxima semana" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Não encontrei o produto? Descrever manualmente" }));
    fireEvent.change(screen.getByPlaceholderText("Ex: Produto personalizado, modelo especial, variação não encontrada..."), { target: { value: "Bandana" } });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar solicitação" }));

    await waitFor(() => {
      expect(createPortalQuoteRequest).toHaveBeenCalledWith("portal-token", {
        title: "Uniformes",
        description: "Cores variadas para entrega na próxima semana",
        items: [{ description: "Bandana", quantity: 20 }],
      });
    });
  });

  test("renders preselected catalog product and updates summary", async () => {
    renderWithQueryClient(
      <CustomerPortalRequestFormPage initialProductId="product-1" token="portal-token" />,
    );

    expect(await screen.findByText("Bandana M")).toBeInTheDocument();
    expect(screen.getByText("SKU BAND-M · Ref. REF-001")).toBeInTheDocument();
    expect(screen.getByText("Produtos do catálogo")).toBeInTheDocument();
    expect(screen.getByText("Itens manuais")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Ex: Pedido de reposição para loja"), { target: { value: "Pedido catálogo" } });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar solicitação" }));

    await waitFor(() => {
      expect(createPortalQuoteRequest).toHaveBeenCalledWith("portal-token", {
        title: "Pedido catálogo",
        description: undefined,
        items: [{ productId: "product-1", description: undefined, quantity: 5 }],
      });
    });
  });
});
