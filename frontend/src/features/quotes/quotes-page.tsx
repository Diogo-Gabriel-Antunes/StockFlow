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
import { DataToolbar } from "@/components/ui/data-toolbar";
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
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { deleteQuote, listQuotes } from "./quote-service";
import { QuoteForm } from "./quote-form";
import type { Quote, QuoteStatus } from "./types";

type ModalMode = "create" | "edit";

const statusOptions: Array<{ value: QuoteStatus | ""; label: string }> = [
  { value: "", label: "Todos" },
  { value: "DRAFT", label: "Rascunho" },
  { value: "SENT", label: "Enviado" },
  { value: "APPROVED", label: "Aprovado" },
  { value: "REJECTED", label: "Recusado" },
  { value: "CANCELLED", label: "Cancelado" },
];

export function QuotesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [status, setStatus] = useState<QuoteStatus | "">("");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<Quote | undefined>();

  const quotes = useQuery({
    queryKey: ["quotes", status, token],
    queryFn: () => listQuotes(token ?? "", { status }),
    enabled: Boolean(token),
  });

  const removeQuote = useMutation({
    mutationFn: (id: string) => deleteQuote(token ?? "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quotes"] }),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

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

  function confirmCancel(quote: Quote) {
    if (
      window.confirm(
        "Tem certeza que deseja continuar? Esta ação pode afetar dados relacionados.",
      )
    ) {
      removeQuote.mutate(quote.id);
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

      <DataToolbar>
        <select
          className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-72"
          onChange={(event) => setStatus(event.target.value as QuoteStatus | "")}
          value={status}
        >
          {statusOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
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
                          onClick={() => confirmCancel(quote)}
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
    </AppLayout>
  );
}

export function statusLabel(status: QuoteStatus) {
  const labels: Record<QuoteStatus, string> = {
    DRAFT: "Rascunho",
    SENT: "Enviado",
    APPROVED: "Aprovado",
    REJECTED: "Recusado",
    EXPIRED: "Expirado",
    CANCELLED: "Cancelado",
  };
  return labels[status];
}

export function statusTone(status: QuoteStatus) {
  const tones = {
    APPROVED: "success",
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
