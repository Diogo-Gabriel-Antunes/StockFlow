"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Modal } from "@/components/ui/Modal";
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

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Orçamentos</p>
          <h1 className="text-2xl font-semibold text-ink">Gestão de orçamentos</h1>
          <p className="mt-1 text-sm text-muted">
            Crie propostas com produtos, serviços e cálculo automático de totais.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800"
          onClick={openCreateModal}
          type="button"
        >
          <Plus size={17} aria-hidden="true" />
          Novo orçamento
        </button>
      </header>

      <div className="mb-4 flex max-w-xs items-center gap-2">
        <Search size={17} className="text-slate-400" aria-hidden="true" />
        <select
          className="h-11 flex-1 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
          onChange={(event) => setStatus(event.target.value as QuoteStatus | "")}
          value={status}
        >
          {statusOptions.map((option) => (
            <option key={option.value || "all"} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
        {quotes.isLoading ? <p className="p-5 text-sm text-muted">Carregando orçamentos...</p> : null}
        {quotes.isError ? (
          <p className="p-5 text-sm font-medium text-red-700">
            Não foi possível carregar os orçamentos.
          </p>
        ) : null}
        {quotes.data && quotes.data.items.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhum orçamento encontrado.</p>
        ) : null}
        {quotes.data && quotes.data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {quotes.data.items.map((quote) => (
                  <tr className="border-t border-border" key={quote.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{quote.code}</td>
                    <td className="px-4 py-3 text-muted">{quote.customerName}</td>
                    <td className="px-4 py-3 text-muted">{statusLabel(quote.status)}</td>
                    <td className="px-4 py-3 text-muted">{currency(quote.total)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          aria-label={`Ver ${quote.code}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-ink transition hover:bg-slate-50"
                          href={`/quotes/${quote.id}`}
                        >
                          <Eye size={16} aria-hidden="true" />
                        </Link>
                        <button
                          aria-label={`Editar ${quote.code}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-ink transition hover:bg-slate-50"
                          onClick={() => openEditModal(quote)}
                          type="button"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Cancelar ${quote.code}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-red-700 transition hover:bg-red-50"
                          disabled={removeQuote.isPending}
                          onClick={() => removeQuote.mutate(quote.id)}
                          type="button"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
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

export function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
