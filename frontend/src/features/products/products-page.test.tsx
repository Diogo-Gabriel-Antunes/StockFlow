import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ProductsPage } from "./products-page";
import { deleteProduct, listProducts } from "./product-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/products",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./product-service", () => ({
  listProducts: vi.fn(),
  deleteProduct: vi.fn(),
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
    vi.mocked(deleteProduct).mockResolvedValue(undefined);
  });

  test("renders loaded products", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Racao Premium")).toBeInTheDocument();
    expect(screen.getByText("PET-001")).toBeInTheDocument();
    expect(listProducts).toHaveBeenCalledWith("token-test", { search: "" });
  });
});
