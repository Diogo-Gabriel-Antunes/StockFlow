"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  CalendarDays,
  FileText,
  PackageX,
  Percent,
  TrendingUp,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
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
import { appToast } from "@/lib/toast";
import { getDashboardSummary, type DashboardSummaryParams } from "./dashboard-service";
import type { DashboardPeriodKey, DashboardSummary } from "./types";

const periodOptions: Array<{ value: DashboardPeriodKey; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "last7days", label: "Últimos 7 dias" },
  { value: "currentMonth", label: "Mês atual" },
  { value: "previousMonth", label: "Mês anterior" },
  { value: "custom", label: "Personalizado" },
];

export function DashboardPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [period, setPeriod] = useState<DashboardPeriodKey>("currentMonth");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DashboardSummaryParams>({
    period: "currentMonth",
  });

  const me = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => getMe(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  const summary = useQuery({
    queryKey: ["dashboard", "summary", appliedFilters, token],
    queryFn: () => getDashboardSummary(token ?? "", appliedFilters),
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

  useEffect(() => {
    if (summary.isError) {
      appToast.error("Não foi possível carregar o dashboard.");
    }
  }, [summary.isError]);

  function changePeriod(value: DashboardPeriodKey) {
    setPeriod(value);
    if (value !== "custom") {
      setAppliedFilters({ period: value });
    }
  }

  function applyCustomPeriod(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dateFrom || !dateTo) {
      appToast.error("Informe data inicial e data final.");
      return;
    }
    setAppliedFilters({ period: "custom", dateFrom, dateTo });
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        eyebrow={me.isLoading ? "StockFlow" : me.data?.company.name ?? "StockFlow"}
        subtitle="Indicadores gerenciais da operação, orçamentos, clientes e estoque."
        title="Dashboard"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Período</CardTitle>
        </CardHeader>
        <form className="flex flex-wrap items-end gap-3 p-5" onSubmit={applyCustomPeriod}>
          <label className="grid gap-1.5" htmlFor="dashboard-period">
            <span className="text-sm font-medium text-ink">Filtro</span>
            <select
              className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-52"
              id="dashboard-period"
              onChange={(event) => changePeriod(event.target.value as DashboardPeriodKey)}
              value={period}
            >
              {periodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {period === "custom" ? (
            <>
              <label className="grid gap-1.5" htmlFor="dashboard-date-from">
                <span className="text-sm font-medium text-ink">Data inicial</span>
                <input
                  className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-40"
                  id="dashboard-date-from"
                  onChange={(event) => setDateFrom(event.target.value)}
                  type="date"
                  value={dateFrom}
                />
              </label>
              <label className="grid gap-1.5" htmlFor="dashboard-date-to">
                <span className="text-sm font-medium text-ink">Data final</span>
                <input
                  className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-40"
                  id="dashboard-date-to"
                  onChange={(event) => setDateTo(event.target.value)}
                  type="date"
                  value={dateTo}
                />
              </label>
              <Button disabled={summary.isFetching} type="submit">
                Aplicar filtro
              </Button>
            </>
          ) : null}
          {summary.data ? (
            <span className="flex h-11 items-center gap-2 text-sm text-muted">
              <CalendarDays size={16} aria-hidden="true" />
              {formatDate(summary.data.period.dateFrom)} a {formatDate(summary.data.period.dateTo)}
            </span>
          ) : null}
        </form>
      </Card>

      {summary.isLoading ? (
        <Card>
          <LoadingState text="Carregando dashboard..." />
        </Card>
      ) : null}

      {summary.isError ? (
        <Card>
          <ErrorState text="Não foi possível carregar o dashboard." />
        </Card>
      ) : null}

      {summary.data ? <DashboardContent summary={summary.data} /> : null}
    </AppLayout>
  );
}

function DashboardContent({ summary }: { summary: DashboardSummary }) {
  const cards = [
    {
      label: "Orçamentos do período",
      value: String(summary.quotes.total),
      icon: FileText,
    },
    {
      label: "Valor aprovado",
      value: currency(summary.quotes.approvedAmount),
      icon: TrendingUp,
    },
    {
      label: "Valor em aberto",
      value: currency(summary.quotes.openAmount),
      icon: FileText,
    },
    {
      label: "Taxa de aprovação",
      value: percent(summary.quotes.approvalRate),
      icon: Percent,
    },
    {
      label: "Produtos com estoque baixo",
      value: String(summary.stock.lowStockCount),
      icon: AlertTriangle,
    },
    {
      label: "Produtos sem estoque",
      value: String(summary.stock.outOfStockCount),
      icon: PackageX,
    },
    {
      label: "Clientes cadastrados",
      value: String(summary.customers.createdInPeriod),
      icon: Users,
    },
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className="min-h-32 rounded-lg border border-border bg-panel p-5 shadow-subtle transition hover:-translate-y-0.5 hover:shadow-md"
              key={card.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted">{card.label}</p>
                  <p className="mt-4 text-3xl font-semibold text-ink">{card.value}</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-900 text-primary dark:bg-slate-900">
                  <Icon size={20} aria-hidden="true" />
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TableSection href="/quotes" title="Últimos orçamentos">
          {summary.recentQuotes.length === 0 ? (
            <EmptyState text="Nenhum orçamento encontrado no período." />
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
                        <Badge tone={statusTone(quote.status)}>
                          {statusLabel(quote.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{currency(quote.total)}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </TableShell>
          )}
        </TableSection>

        <TableSection href="/stock/replenishment" title="Produtos críticos">
          {summary.criticalProducts.length === 0 ? (
            <EmptyState text="Nenhum produto crítico no momento." />
          ) : (
            <TableShell>
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Produto</TableHeaderCell>
                    <TableHeaderCell>Estoque</TableHeaderCell>
                    <TableHeaderCell>Mínimo</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {summary.criticalProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell primary>
                        <p className="font-semibold text-ink">{product.name}</p>
                        <p className="text-xs text-muted">{product.sku ?? "-"}</p>
                      </TableCell>
                      <TableCell>{product.stockQuantity}</TableCell>
                      <TableCell>{product.minimumStock}</TableCell>
                      <TableCell>
                        <Badge tone={product.status === "OUT_OF_STOCK" ? "danger" : "warning"}>
                          {product.status === "OUT_OF_STOCK" ? "Sem estoque" : "Estoque baixo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </TableShell>
          )}
        </TableSection>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <TableSection href="/stock/movements" title="Últimas movimentações">
          {summary.recentStockMovements.length === 0 ? (
            <EmptyState text="Nenhuma movimentação recente." />
          ) : (
            <TableShell>
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Produto</TableHeaderCell>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>Quantidade</TableHeaderCell>
                    <TableHeaderCell>Novo estoque</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {summary.recentStockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell primary>{movement.productName}</TableCell>
                      <TableCell>
                        <Badge tone={movementTone(movement.type)}>
                          {movementLabel(movement.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{movement.quantity}</TableCell>
                      <TableCell>{movement.newQuantity}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </TableShell>
          )}
        </TableSection>

        <TableSection href="/customers" title="Últimos clientes">
          {summary.recentCustomers.length === 0 ? (
            <EmptyState text="Nenhum cliente cadastrado recentemente." />
          ) : (
            <TableShell>
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Nome</TableHeaderCell>
                    <TableHeaderCell>Documento</TableHeaderCell>
                    <TableHeaderCell>Contato</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {summary.recentCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell primary>{customer.name}</TableCell>
                      <TableCell>{customer.document ?? "-"}</TableCell>
                      <TableCell>{customer.phone ?? customer.email ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </TableShell>
          )}
        </TableSection>
      </section>
    </div>
  );
}

function TableSection({
  children,
  href,
  title,
}: {
  children: React.ReactNode;
  href: string;
  title: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader
        action={
          <ButtonLink href={href} size="sm" variant="ghost">
            Ver todos
          </ButtonLink>
        }
      >
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {children}
    </Card>
  );
}

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function percent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function statusTone(status: Parameters<typeof statusLabel>[0]) {
  const tones = {
    CUSTOMER_APPROVED: "green",
    COMPLETED: "green",
    CANCELLED: "slate",
    DRAFT: "blue",
    EXPIRED: "amber",
    REJECTED: "red",
    SENT: "amber",
  } as const;
  return tones[status];
}

function movementLabel(type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "CANCELLATION") {
  const labels = {
    IN: "Entrada",
    OUT: "Saída",
    ADJUSTMENT: "Ajuste",
    SALE: "Venda",
    CANCELLATION: "Cancelamento",
  };
  return labels[type];
}

function movementTone(type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "CANCELLATION") {
  const tones = {
    IN: "success",
    OUT: "danger",
    ADJUSTMENT: "info",
    SALE: "warning",
    CANCELLATION: "slate",
  } as const;
  return tones[type];
}
