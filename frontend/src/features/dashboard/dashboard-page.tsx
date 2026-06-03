"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, FileText, LogOut, Percent, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { getMe } from "@/features/auth/auth-service";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { statusLabel } from "@/features/quotes/quotes-page";
import { getDashboardSummary } from "./dashboard-service";
import type { DashboardSummary } from "./types";

export function DashboardPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const me = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => getMe(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  const summary = useQuery({
    queryKey: ["dashboard", "summary", token],
    queryFn: () => getDashboardSummary(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
      return;
    }

    if (me.isError) {
      clearToken();
      router.replace("/login");
    }
  }, [me.isError, router, token]);

  function logout() {
    clearToken();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">StockFlow</p>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">
            {me.isLoading ? "Carregando..." : me.data?.company.name ?? "Visão gerencial"}
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
          onClick={logout}
          type="button"
        >
          <LogOut size={17} aria-hidden="true" />
          Sair
        </button>
      </header>

      {summary.isLoading ? (
        <p className="rounded-lg border border-border bg-panel p-5 text-sm text-muted shadow-subtle">
          Carregando indicadores...
        </p>
      ) : null}

      {summary.isError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800">
          Não foi possível carregar os indicadores agora.
        </p>
      ) : null}

      {summary.data ? <DashboardContent summary={summary.data} /> : null}
    </AppLayout>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const cards = [
    {
      label: "Orçamentos do mês",
      value: String(summary.totalQuotesMonth),
      icon: FileText,
    },
    {
      label: "Valor aprovado no mês",
      value: currency(summary.approvedValueMonth),
      icon: TrendingUp,
    },
    {
      label: "Valor em aberto",
      value: currency(summary.openValue),
      icon: FileText,
    },
    {
      label: "Taxa de aprovação",
      value: `${summary.approvalRate.toFixed(2)}%`,
      icon: Percent,
    },
    {
      label: "Produtos com estoque baixo",
      value: String(summary.lowStockProductCount),
      icon: Boxes,
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className="rounded-lg border border-border bg-panel p-4 shadow-subtle"
              key={card.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-ink">{card.value}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-primary">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TableSection title="Últimos orçamentos">
          {summary.recentQuotes.length === 0 ? (
            <EmptyRow text="Nenhum orçamento encontrado." />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentQuotes.map((quote) => (
                  <tr className="border-t border-border" key={quote.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{quote.code}</td>
                    <td className="px-4 py-3 text-muted">{quote.customerName}</td>
                    <td className="px-4 py-3 text-muted">{statusLabel(quote.status)}</td>
                    <td className="px-4 py-3 text-muted">{currency(quote.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableSection>

        <TableSection title="Últimos clientes">
          {summary.recentCustomers.length === 0 ? (
            <EmptyRow text="Nenhum cliente encontrado." />
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nome</th>
                  <th className="px-4 py-3 font-semibold">Contato</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentCustomers.map((customer) => (
                  <tr className="border-t border-border" key={customer.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{customer.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {customer.email ?? customer.phone ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableSection>
      </section>

      <TableSection title="Produtos com estoque baixo">
        {summary.lowStockProducts.length === 0 ? (
          <EmptyRow text="Nenhum produto crítico no momento." />
        ) : (
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Produto</th>
                <th className="px-4 py-3 font-semibold">Estoque</th>
                <th className="px-4 py-3 font-semibold">Mínimo</th>
                <th className="px-4 py-3 font-semibold">Compra sugerida</th>
              </tr>
            </thead>
            <tbody>
              {summary.lowStockProducts.map((product) => (
                <tr className="border-t border-border" key={product.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{product.name}</p>
                    <p className="text-xs text-muted">{product.sku ?? "-"}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {product.stockQuantity} {product.unit}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {product.minimumStock} {product.unit}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {product.suggestedPurchaseQuantity} {product.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableSection>
    </div>
  );
}

function TableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
      <h2 className="border-b border-border px-4 py-3 text-sm font-semibold text-ink">
        {title}
      </h2>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="p-5 text-sm text-muted">{text}</p>;
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
