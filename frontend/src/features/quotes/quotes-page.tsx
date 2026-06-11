"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { deleteQuote, listQuotes } from "./quote-service";
import { QuoteForm } from "./quote-form";
import type { Quote, QuoteStatus } from "./types";

type ModalMode = "create" | "edit";

const statusOptions: Array<{ value: QuoteStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "SENT", label: "Enviado" },
  { value: "CUSTOMER_APPROVED", label: "Aprovado pelo cliente" },
  { value: "COMPLETED", label: "Concluído" },
  { value: "REJECTED", label: "Recusado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "EXPIRED", label: "Expirado" },
];

export function QuotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<QuoteStatus | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<Quote | undefined>();
  const [quoteToCancel, setQuoteToCancel] = useState<Quote | null>(null);

  const quotes = useQuery({
    queryKey: ["quotes", submittedSearch, status, dateFrom, dateTo, page, size, token],
    queryFn: () => listQuotes(token ?? "", { dateFrom, dateTo, page, search: submittedSearch, size, status }),
    enabled: Boolean(token),
  });

  const removeQuote = useMutation({
    mutationFn: (id: string) => deleteQuote(token ?? "", id),
    onSuccess: () => {
      appToast.success("Orçamento cancelado com sucesso.");
      setQuoteToCancel(null);
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível cancelar o orçamento."));
    },
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (quotes.isError) {
      appToast.error("Não foi possível carregar os orçamentos.");
    }
  }, [quotes.isError]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
  }

  function changeStatus(value: QuoteStatus | "") {
    setPage(0);
    setStatus(value);
  }

  function changeDateFrom(value: string) {
    setPage(0);
    setDateFrom(value);
  }

  function changeDateTo(value: string) {
    setPage(0);
    setDateTo(value);
  }

  function changeSize(value: number) {
    setPage(0);
    setSize(value);
  }

  function openCreateModal() {
    setMode("create");
    setSelectedItem(undefined);
    setIsOpen(true);
  }

  function openEditModal(quote: Quote) {
    setMode("edit");
    setSelectedItem(quote);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setSelectedItem(undefined);
    setMode("create");
  }

  function handleSaved() {
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["quotes"] });
  }

  function confirmCancel() {
    if (quoteToCancel) {
      removeQuote.mutate(quoteToCancel.id);
    }
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        action={
          <Button onClick={openCreateModal} type="button">
            <Plus size={17} aria-hidden="true" />
            Novo orçamento
          </Button>
        }
        eyebrow="Orçamentos"
        subtitle="Crie propostas com produtos, serviços e cálculo automático de totais."
        title="Gestão de orçamentos"
      />

      <DataToolbar
        onSubmit={submitSearch}
        search={{
          onChange: setSearch,
          placeholder: "Buscar por código ou cliente...",
          value: search,
        }}
      >
        <select
          className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-72"
          onChange={(event) => changeStatus(event.target.value as QuoteStatus | "")}
          value={status}
        >
          {statusOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          aria-label="Data inicial"
          className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-40"
          onChange={(event) => changeDateFrom(event.target.value)}
          type="date"
          value={dateFrom}
        />
        <input
          aria-label="Data final"
          className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-40"
          onChange={(event) => changeDateTo(event.target.value)}
          type="date"
          value={dateTo}
        />
      </DataToolbar>

      <Card className="overflow-hidden">
        {quotes.isLoading ? <LoadingState text="Carregando orçamentos..." /> : null}
        {quotes.isError ? (
          <ErrorState text="Não foi possível carregar os orçamentos." />
        ) : null}
        {quotes.data && quotes.data.items.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={openCreateModal} type="button">
                <Plus size={17} aria-hidden="true" />
                Novo orçamento
              </Button>
            }
            description="Crie sua primeira proposta com produtos, serviços, totais e link público."
            icon={<FileText size={20} aria-hidden="true" />}
            title="Nenhum orçamento encontrado"
          />
        ) : null}
        {quotes.data && quotes.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Código</TableHeaderCell>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Total</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {quotes.data.items.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell primary>{quote.code}</TableCell>
                    <TableCell>{quote.customerName}</TableCell>
                    <TableCell>
                      <Badge tone={statusTone(quote.status)}>{statusLabel(quote.status)}</Badge>
                    </TableCell>
                    <TableCell>{currency(quote.total)}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <Link
                          aria-label={`Ver ${quote.code}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-ink transition hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900"
                          href={`/quotes/${quote.id}`}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </Link>
                        <ActionButton
                          aria-label={`Editar ${quote.code}`}
                          onClick={() => openEditModal(quote)}
                          type="button"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </ActionButton>
                        <ActionButton
                          aria-label={`Cancelar ${quote.code}`}
                          disabled={removeQuote.isPending}
                          onClick={() => setQuoteToCancel(quote)}
                          type="button"
                          variant="danger"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
        {quotes.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={quotes.data.page}
            size={quotes.data.size}
            total={quotes.data.totalElements ?? quotes.data.total}
            totalPages={quotes.data.totalPages}
          />
        ) : null}
      </Card>
      <Modal
        description="Crie ou ajuste o orçamento sem sair da listagem."
        isOpen={isOpen}
        onClose={closeModal}
        size="wide"
        title={mode === "create" ? "Novo orçamento" : "Editar orçamento"}
      >
        <QuoteForm
          key={selectedItem?.id ?? "new-quote"}
          onCancel={closeModal}
          onSaved={handleSaved}
          quote={selectedItem}
        />
      </Modal>
      <ConfirmDialog
        confirmLabel="Cancelar orçamento"
        description="Tem certeza que deseja cancelar este orçamento? Esta ação pode afetar o histórico comercial."
        loading={removeQuote.isPending}
        loadingLabel="Cancelando..."
        onCancel={() => setQuoteToCancel(null)}
        onConfirm={confirmCancel}
        open={Boolean(quoteToCancel)}
        title="Cancelar orçamento"
        variant="danger"
      />
    </AppLayout>
  );
}

export function statusLabel(status: QuoteStatus) {
  const labels: Record<QuoteStatus, string> = {
    DRAFT: "Rascunho",
    SENT: "Enviado",
    CUSTOMER_APPROVED: "Aprovado pelo cliente",
    COMPLETED: "Concluído",
    REJECTED: "Recusado",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
  };
  return labels[status];
}

export function statusTone(status: QuoteStatus) {
  const tones = {
    CUSTOMER_APPROVED: "success",
    COMPLETED: "success",
    CANCELLED: "slate",
    DRAFT: "info",
    EXPIRED: "warning",
    REJECTED: "danger",
    SENT: "warning",
  } as const;
  return tones[status];
}

export function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
