import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { Sidebar } from "./sidebar";
import { clearToken } from "@/features/auth/auth-storage";

const replace = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/customers",
  useRouter: () => ({ replace, refresh }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  clearToken: vi.fn(),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders private navigation items and marks the current route", () => {
    render(<Sidebar />);

    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("link", { name: /Clientes/i })).toHaveAttribute(
      "href",
      "/customers",
    );
    expect(screen.getByRole("link", { name: /Produtos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Serviços/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Movimentações de estoque/i }),
    ).toHaveAttribute("href", "/stock/movements");
    expect(screen.getByRole("link", { name: /Estoque baixo/i })).toHaveAttribute(
      "href",
      "/stock/low",
    );
    expect(screen.getByRole("link", { name: /Reposição \/ Compras/i })).toHaveAttribute(
      "href",
      "/stock/replenishment",
    );
    expect(screen.getByRole("link", { name: /Orçamentos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clientes/i })).toHaveClass(
      "bg-sky-500/15",
    );
  });

  test("logs out from the authenticated layout", () => {
    render(<Sidebar />);

    fireEvent.click(screen.getByRole("button", { name: /Sair/i }));

    expect(clearToken).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/login");
    expect(refresh).toHaveBeenCalled();
  });
});
