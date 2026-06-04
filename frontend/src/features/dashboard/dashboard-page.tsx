"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, FileText, Percent, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
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

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        eyebrow={me.isLoading ? "StockFlow" : me.data?.company.name ?? "StockFlow"}
        subtitle="Visão geral da operação, orçamentos e estoque."
        title="Dashboard"
      />

      {summary.isLoading ? (
        <Card>
          <LoadingState text="Carregando indicadores..." />
        </Card>
      ) : null}

      {summary.isError ? (
        <Card>
          <ErrorState text="Não foi possível carregar os indicadores agora." />
        </Card>
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
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className="min-h-36 rounded-lg border border-border bg-panel p-5 shadow-subtle transition hover:-translate-y-0.5 hover:shadow-md"
              key={card.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">
                    {card.value}
                  </p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-50 text-primary dark:bg-slate-900">
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
            <TableShell>
              <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Código</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {summary.recentQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell primary>{quote.code}</TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone(quote.status)}>{statusLabel(quote.status)}</Badge>
                    </TableCell>
                    <TableCell>{currency(quote.total)}</TableCell>
                  </TableRow>
                ))}
              </tbody>
              </DataTable>
            </TableShell>
          )}
        </TableSection>

        <TableSection title="Últimos clientes">
          {summary.recentCustomers.length === 0 ? (
            <EmptyRow text="Nenhum cliente encontrado." />
          ) : (
            <TableShell>
              <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Nome</TableHeaderCell>
                  <TableHeaderCell>Contato</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {summary.recentCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell primary>{customer.name}</TableCell>
                    <TableCell>
                      {customer.email ?? customer.phone ?? "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
              </DataTable>
            </TableShell>
          )}
        </TableSection>
      </section>

      <TableSection title="Produtos com estoque baixo">
        {summary.lowStockProducts.length === 0 ? (
          <EmptyRow text="Nenhum produto crítico no momento." />
        ) : (
          <TableShell>
            <DataTable>
            <TableHead>
              <tr>
                <TableHeaderCell>Produto</TableHeaderCell>
                <TableHeaderCell>Estoque</TableHeaderCell>
                <TableHeaderCell>Mínimo</TableHeaderCell>
                <TableHeaderCell>Compra sugerida</TableHeaderCell>
              </tr>
            </TableHead>
            <tbody>
              {summary.lowStockProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell primary>
                    <p className="font-semibold text-ink">{product.name}</p>
                    <p className="text-xs text-muted">{product.sku ?? "-"}</p>
                  </TableCell>
                  <TableCell>
                    {product.stockQuantity} {product.unit}
                  </TableCell>
                  <TableCell>
                    {product.minimumStock} {product.unit}
                  </TableCell>
                  <TableCell>
                    <Badge tone="amber">
                      {product.suggestedPurchaseQuantity} {product.unit}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </tbody>
            </DataTable>
          </TableShell>
        )}
      </TableSection>
    </div>
  );
}

function TableSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <EmptyState text={text} />;
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function statusTone(status: Parameters<typeof statusLabel>[0]) {
  const tones = {
    APPROVED: "green",
    CANCELLED: "slate",
    DRAFT: "blue",
    EXPIRED: "amber",
    REJECTED: "red",
    SENT: "amber",
  } as const;
  return tones[status];
}
