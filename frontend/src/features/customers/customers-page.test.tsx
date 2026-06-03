import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CustomersPage } from "./customers-page";
import { deleteCustomer, listCustomers } from "./customer-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/customers",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./customer-service", () => ({
  listCustomers: vi.fn(),
  deleteCustomer: vi.fn(),
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
    vi.mocked(deleteCustomer).mockResolvedValue(undefined);
  });

  test("renders loaded customers", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Cliente Teste")).toBeInTheDocument();
    expect(screen.getByText("cliente@stockflow.test")).toBeInTheDocument();
    expect(listCustomers).toHaveBeenCalledWith("token-test", { search: "" });
  });
});
