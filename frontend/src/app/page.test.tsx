import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import Home from "./page";

describe("Landing page", () => {
  test("renders the main SaaS landing sections and actions", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: /Controle seus orçamentos e estoque em um só lugar\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Solicitar demonstração/i })[0],
    ).toHaveAttribute("href", "#contato");
    expect(screen.getByRole("link", { name: /Entrar no sistema/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByText(/Orçamentos espalhados em planilhas/i)).toBeInTheDocument();
    expect(screen.getByText(/Cadastrar produtos/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Funcionalidades/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Preços/i })[0]).toHaveAttribute(
      "href",
      "#precos",
    );
    expect(screen.getByText(/Planos simples para começar/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Starter" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Business" })).toBeInTheDocument();
    expect(screen.getByText(/Mais indicado/i)).toBeInTheDocument();
    expect(screen.getByText(/Preço fundador para os primeiros clientes/i)).toBeInTheDocument();
    expect(screen.getByText(/R\$ 39\/mês/i)).toBeInTheDocument();
    expect(screen.getByText(/Fornecedores pet/i)).toBeInTheDocument();
    expect(screen.getByText(/Sobre o StockFlow/i)).toBeInTheDocument();
    expect(screen.getByText(/Pare de perder tempo com planilhas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Acessar sistema/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.getByText(/Sistema de orçamento com estoque integrado\./i)).toBeInTheDocument();
  });
});
