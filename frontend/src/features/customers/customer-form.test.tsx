import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { CustomerForm } from "./customer-form";
import { createCustomer, updateCustomer } from "./customer-service";

const replace = vi.fn();
const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push, refresh }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: () => "token-test",
}));

vi.mock("./customer-service", () => ({
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}));

describe("CustomerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createCustomer).mockResolvedValue({
      id: "customer-1",
      companyId: "company-1",
      name: "Cliente Teste",
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
  });

  test("creates a customer with required fields", async () => {
    render(<CustomerForm />);

    fireEvent.change(screen.getByLabelText("Nome"), {
      target: { value: "Cliente Teste" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith(
        "token-test",
        expect.objectContaining({
          name: "Cliente Teste",
          type: "PERSON",
        }),
      );
    });
    expect(updateCustomer).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/customers");
  });

  test("shows validation error when name is missing", async () => {
    render(<CustomerForm />);

    fireEvent.click(screen.getByRole("button", { name: "Salvar cliente" }));

    expect(await screen.findByText("Nome é obrigatório.")).toBeInTheDocument();
    expect(createCustomer).not.toHaveBeenCalled();
  });
});
