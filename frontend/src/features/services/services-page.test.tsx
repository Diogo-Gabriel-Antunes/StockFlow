import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ServicesPage } from "./services-page";
import { deleteServiceItem, listServiceItems } from "./service-item-service";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/services",
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
  clearToken: vi.fn(),
}));

vi.mock("./service-item-service", () => ({
  listServiceItems: vi.fn(),
  deleteServiceItem: vi.fn(),
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
      size: 20,
      total: 1,
    });
    vi.mocked(deleteServiceItem).mockResolvedValue(undefined);
  });

  test("renders loaded services", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Banho e Tosa")).toBeInTheDocument();
    expect(screen.getByText("Servico completo")).toBeInTheDocument();
    expect(listServiceItems).toHaveBeenCalledWith("token-test", { search: "" });
  });
});
