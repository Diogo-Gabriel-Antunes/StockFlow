import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CustomersPage } from "./customers-page";
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from "./customer-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/customers",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./customer-service", () => ({
  createCustomer: vi.fn(),
  listCustomers: vi.fn(),
  deleteCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CustomersPage />
    </QueryClientProvider>,
  );
}

describe("CustomersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listCustomers).mockResolvedValue({
      items: [
        {
          id: "customer-1",
          companyId: "company-1",
          name: "Cliente Teste",
          type: "PERSON",
          document: "123",
          email: "cliente@stockflow.test",
          phone: null,
          whatsapp: null,
          city: "Sao Paulo",
          state: "SP",
          notes: null,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      total: 1,
    });
    vi.mocked(createCustomer).mockResolvedValue({
      id: "customer-2",
      companyId: "company-1",
      name: "Novo Cliente",
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
    });
    vi.mocked(updateCustomer).mockResolvedValue({
      id: "customer-1",
      companyId: "company-1",
      name: "Cliente Editado",
      type: "PERSON",
      document: "123",
      email: "cliente@stockflow.test",
      phone: null,
      whatsapp: null,
      city: "Sao Paulo",
      state: "SP",
      notes: null,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    vi.mocked(deleteCustomer).mockResolvedValue(undefined);
  });

  test("renders loaded customers", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Cliente Teste")).toBeInTheDocument();
    expect(screen.getByText("cliente@stockflow.test")).toBeInTheDocument();
    expect(listCustomers).toHaveBeenCalledWith("token-test", { search: "" });
  });

  test("creates, edits, cancels and keeps modal open on error", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Cliente Teste")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo cliente" }));
    expect(screen.getByRole("dialog", { name: "Novo cliente" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(createCustomer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Novo cliente" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Novo Cliente" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

    await waitFor(() => expect(createCustomer).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Novo cliente" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Cliente Teste" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Cliente Editado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

    await waitFor(() => expect(updateCustomer).toHaveBeenCalled());

    vi.mocked(updateCustomer).mockRejectedValueOnce(new Error("failed"));
    fireEvent.click(screen.getByRole("button", { name: "Editar Cliente Teste" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

    expect(await screen.findByText("Não foi possível salvar o cliente.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar cliente" })).toBeInTheDocument();
  });
});
