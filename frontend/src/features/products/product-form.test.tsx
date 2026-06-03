import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProductForm } from "./product-form";
import { createProduct, updateProduct } from "./product-service";

const replace = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
}));

vi.mock("./product-service", () => ({
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
}));

describe("ProductForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createProduct).mockResolvedValue({
      id: "product-1",
      companyId: "company-1",
      name: "Produto Teste",
      sku: "SKU-1",
      category: "Pet",
      costPrice: 10,
      salePrice: 20,
      unit: "UN",
      stockQuantity: 5,
      minimumStock: 1,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
  });

  test("creates a product with required fields", async () => {
    render(<ProductForm />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Produto Teste" },
    });
    fireEvent.change(screen.getByLabelText("Preço de venda"), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));

    await waitFor(() => {
      expect(createProduct).toHaveBeenCalledWith(
        "token-test",
        expect.objectContaining({
          name: "Produto Teste",
          salePrice: 20,
          unit: "UN",
        }),
      );
    });
    expect(updateProduct).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/products");
  });

  test("shows validation error for negative sale price", async () => {
    render(<ProductForm />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Produto Teste" },
    });
    fireEvent.change(screen.getByLabelText("Preço de venda"), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar produto" }));

    expect(
      await screen.findByText("Informe um valor maior ou igual a zero."),
    ).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
  });
});
