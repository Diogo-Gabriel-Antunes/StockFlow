import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProductsPage } from "./products-page";
import { createProduct, deleteProduct, listProducts, updateProduct } from "./product-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/products",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./product-service", () => ({
  createProduct: vi.fn(),
  listProducts: vi.fn(),
  deleteProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ProductsPage />
    </QueryClientProvider>,
  );
}

describe("ProductsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listProducts).mockResolvedValue({
      items: [
        {
          id: "product-1",
          companyId: "company-1",
          name: "Racao Premium",
          sku: "PET-001",
          category: "Pet",
          costPrice: 10,
          salePrice: 25,
          unit: "UN",
          stockQuantity: 8,
          minimumStock: 2,
          active: true,
          createdAt: "2026-06-03T00:00:00Z",
          updatedAt: "2026-06-03T00:00:00Z",
        },
      ],
      page: 0,
      size: 20,
      total: 1,
    });
    vi.mocked(createProduct).mockResolvedValue({
      id: "product-2",
      companyId: "company-1",
      name: "Produto Novo",
      sku: "PET-002",
      category: "Pet",
      costPrice: 10,
      salePrice: 30,
      unit: "UN",
      stockQuantity: 1,
      minimumStock: 1,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    vi.mocked(updateProduct).mockResolvedValue({
      id: "product-1",
      companyId: "company-1",
      name: "Racao Editada",
      sku: "PET-001",
      category: "Pet",
      costPrice: 10,
      salePrice: 25,
      unit: "UN",
      stockQuantity: 8,
      minimumStock: 2,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
    vi.mocked(deleteProduct).mockResolvedValue(undefined);
  });

  test("renders loaded products", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Racao Premium")).toBeInTheDocument();
    expect(screen.getByText("PET-001")).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledWith("token-test", { search: "" });
  });

  test("creates, edits, cancels and keeps modal open on error", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Racao Premium")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Novo produto" }));
    expect(screen.getByRole("dialog", { name: "Novo produto" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(createProduct).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Novo produto" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Produto Novo" } });
    fireEvent.change(screen.getByLabelText("Preço de venda"), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));

    await waitFor(() => expect(createProduct).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Novo produto" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Editar Racao Premium" }));
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Racao Editada" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));

    await waitFor(() => expect(updateProduct).toHaveBeenCalled());

    vi.mocked(updateProduct).mockRejectedValueOnce(new Error("failed"));
    fireEvent.click(screen.getByRole("button", { name: "Editar Racao Premium" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));

    expect(await screen.findByText("Não foi possível salvar o produto.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Editar produto" })).toBeInTheDocument();
  });
});
