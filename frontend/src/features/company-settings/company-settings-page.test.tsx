import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type React from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { appToast } from "@/lib/toast";
import { getCompanySettings, updateCompanySettings } from "./company-settings-service";
import { CompanySettingsPage } from "./company-settings-page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/settings/company",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("@/components/layout/app-layout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/toast", () => ({
  appToast: {
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  getApiErrorMessage: (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback,
}));

vi.mock("./company-settings-service", () => ({
  getCompanySettings: vi.fn(),
  updateCompanySettings: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CompanySettingsPage />
    </QueryClientProvider>,
  );
}

const settings = {
  tradeName: "Gabriel Pet",
  legalName: "Gabriel Pet LTDA",
  document: "12.345.678/0001-90",
  email: "contato@gabrielpet.com.br",
  phone: "(47) 3333-3333",
  whatsapp: "(47) 99999-9999",
  address: "Rua Exemplo",
  addressNumber: "123",
  addressComplement: "Sala 2",
  neighborhood: "Centro",
  city: "Joinville",
  state: "SC",
  zipCode: "89200-000",
  defaultQuoteNotes: "Proposta válida conforme condições apresentadas.",
  defaultPaymentTerms: "50% na aprovação e 50% na entrega.",
  defaultQuoteValidityDays: 7,
};

describe("CompanySettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCompanySettings).mockResolvedValue(settings);
    vi.mocked(updateCompanySettings).mockResolvedValue(settings);
  });

  test("renders loading and fills form with API data", async () => {
    renderWithQueryClient();

    expect(screen.getByText("Carregando configurações da empresa...")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Gabriel Pet")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Joinville")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50% na aprovação e 50% na entrega.")).toBeInTheDocument();
    expect(getCompanySettings).toHaveBeenCalledWith("token-test");
  });

  test("validates email and validity days before saving", async () => {
    renderWithQueryClient();

    const email = await screen.findByLabelText("E-mail");
    fireEvent.change(email, { target: { value: "email-invalido" } });
    fireEvent.change(screen.getByLabelText("Validade padrão do orçamento em dias"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));

    expect(await screen.findByText("Informe um e-mail válido.")).toBeInTheDocument();
    expect(screen.getByText("Informe um valor maior que zero.")).toBeInTheDocument();
    expect(updateCompanySettings).not.toHaveBeenCalled();
  });

  test("saves settings and shows success toast", async () => {
    renderWithQueryClient();

    const tradeName = await screen.findByLabelText("Nome comercial");
    fireEvent.change(tradeName, { target: { value: "Nova Empresa" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));

    await waitFor(() => {
      expect(updateCompanySettings).toHaveBeenCalledWith("token-test", expect.objectContaining({
        tradeName: "Nova Empresa",
        defaultQuoteValidityDays: 7,
      }));
    });
    expect(appToast.success).toHaveBeenCalledWith("Configurações da empresa salvas com sucesso.");
  });

  test("shows toast on load and save errors", async () => {
    vi.mocked(getCompanySettings).mockRejectedValueOnce(new Error("load failed"));

    renderWithQueryClient();

    expect(
      await screen.findByText("Não foi possível carregar as configurações da empresa."),
    ).toBeInTheDocument();
    expect(appToast.error).toHaveBeenCalledWith("Não foi possível carregar as configurações da empresa.");

    vi.clearAllMocks();
    vi.mocked(getCompanySettings).mockResolvedValue(settings);
    vi.mocked(updateCompanySettings).mockRejectedValueOnce(new Error("save failed"));
    renderWithQueryClient();

    await screen.findByDisplayValue("Gabriel Pet");
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));

    await waitFor(() => {
      expect(appToast.error).toHaveBeenCalledWith("save failed");
    });
  });

  test("disables submit button while saving", async () => {
    vi.mocked(updateCompanySettings).mockReturnValue(new Promise(() => undefined));
    renderWithQueryClient();

    await screen.findByDisplayValue("Gabriel Pet");
    fireEvent.click(screen.getByRole("button", { name: "Salvar configurações" }));

    expect(await screen.findByRole("button", { name: "Salvando..." })).toBeDisabled();
  });
});
