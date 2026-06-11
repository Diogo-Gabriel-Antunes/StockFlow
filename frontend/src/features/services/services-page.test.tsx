import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ServicesPage } from "./services-page";
import {
  createServiceItem,
  deleteServiceItem,
  listServiceItems,
  updateServiceItem,
} from "./service-item-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/services",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./service-item-service", () => ({
  createServiceItem: vi.fn(),
  listServiceItems: vi.fn(),
  deleteServiceItem: vi.fn(),
  updateServiceItem: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ServicesPage />
    </QueryClientProvider>,
  );
}

describe("ServicesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listServiceItems).mockResolvedValue({
      items: [
        {
          id: "service-1",
          companyId: "company-1",
          name: "Banho e Tosa",
          description: "Servico completo",
          defaultPrice: 80,
          estimatedCost: 20,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 10,
      total: 1,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(createServiceItem).mockResolvedValue({
      id: "service-2",
      companyId: "company-1",
      name: "Servico Novo",
      description: "Novo",
      defaultPrice: 60,
      estimatedCost: 10,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    vi.mocked(updateServiceItem).mockResolvedValue({
      id: "service-1",
      companyId: "company-1",
      name: "Banho Editado",
      description: "Servico completo",
      defaultPrice: 80,
      estimatedCost: 20,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    vi.mocked(deleteServiceItem).mockResolvedValue(undefined);
  });

  test("renders loaded services", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Banho e Tosa")).toBeInTheDocument();
    expect(screen.getByText("Servico completo")).toBeInTheDocument();
    expect(listServiceItems).toHaveBeenCalledWith("token-test", {
      active: true,
      page: 0,
      search: "",
      size: 10,
    });
  });

  test("creates, edits, cancels and keeps modal open on error", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Banho e Tosa")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo serviço" }));
    expect(screen.getByRole("dialog", { name: "Novo serviço" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(createServiceItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Novo serviço" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Servico Novo" } });
    fireEvent.change(screen.getByLabelText("Preço padrão"), { target: { value: "60" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    await waitFor(() => expect(createServiceItem).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Novo serviço" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Banho e Tosa" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Banho Editado" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    await waitFor(() => expect(updateServiceItem).toHaveBeenCalled());

    vi.mocked(updateServiceItem).mockRejectedValueOnce(new Error("failed"));
    fireEvent.click(screen.getByRole("button", { name: "Editar Banho e Tosa" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    expect(await screen.findByText("Não foi possível salvar o serviço.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar serviço" })).toBeInTheDocument();
  });
});
