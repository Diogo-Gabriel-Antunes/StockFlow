import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Sidebar } from "./sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/customers",
}));

describe("Sidebar", () => {
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
    expect(screen.getByRole("link", { name: /Estoque/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Reposição \/ Compras/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Orçamentos/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Configurações/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Clientes/i })).toHaveClass(
      "bg-teal-50",
    );
  });
});
