import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ServiceItemForm } from "./service-item-form";
import { createServiceItem, updateServiceItem } from "./service-item-service";

const replace = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
}));

vi.mock("./service-item-service", () => ({
  createServiceItem: vi.fn(),
  updateServiceItem: vi.fn(),
}));

describe("ServiceItemForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createServiceItem).mockResolvedValue({
      id: "service-1",
      companyId: "company-1",
      name: "Banho e Tosa",
      description: "Servico",
      defaultPrice: 80,
      estimatedCost: 20,
      active: true,
      createdAt: "2026-06-03T00:00:00Z",
      updatedAt: "2026-06-03T00:00:00Z",
    });
  });

  test("creates a service item with required fields", async () => {
    render(<ServiceItemForm />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Banho e Tosa" },
    });
    fireEvent.change(screen.getByLabelText("Preço padrão"), {
      target: { value: "80" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    await waitFor(() => {
      expect(createServiceItem).toHaveBeenCalledWith(
        "token-test",
        expect.objectContaining({
          name: "Banho e Tosa",
          defaultPrice: 80,
        }),
      );
    });
    expect(updateServiceItem).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/services");
  });

  test("shows validation error when name is missing", async () => {
    render(<ServiceItemForm />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar serviço" }));

    expect(await screen.findByText("Nome é obrigatório.")).toBeInTheDocument();
    expect(createServiceItem).not.toHaveBeenCalled();
  });
});
