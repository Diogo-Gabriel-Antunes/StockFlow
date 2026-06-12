"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  convertQuoteRequestToQuote,
  listInternalQuoteRequests,
  updateInternalQuoteRequestStatus,
} from "./customer-portal-service";
import { quoteRequestStatusLabel } from "./customer-portal-page";
import { ProductImage } from "./customer-portal-products-page";
import type { QuoteRequest, QuoteRequestStatus } from "./types";

export function QuoteRequestsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<QuoteRequestStatus | "">("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [selected, setSelected] = useState<QuoteRequest | null>(null);

  const requests = useQuery({
    queryKey: ["quote-requests", submittedSearch, status, page, size, token],
    queryFn: () => listInternalQuoteRequests(token ?? "", { page, search: submittedSearch, size, status }),
    enabled: Boolean(token),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, next }: { id: string; next: QuoteRequestStatus }) =>
      updateInternalQuoteRequestStatus(token ?? "", id, next),
    onSuccess: () => {
      appToast.success("Solicitação atualizada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível atualizar a solicitação.")),
  });

  const convert = useMutation({
    mutationFn: (id: string) => convertQuoteRequestToQuote(token ?? "", id),
    onSuccess: (quote) => {
      appToast.success("Solicitação convertida em orçamento.");
      queryClient.invalidateQueries({ queryKey: ["quote-requests"] });
      router.push(`/quotes/${quote.id}`);
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível converter a solicitação.")),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (requests.isError) {
      appToast.error("Não foi possível carregar as solicitações.");
    }
  }, [requests.isError]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
  }

  function changeStatus(next: QuoteRequestStatus | "") {
    setPage(0);
    setStatus(next);
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        eyebrow="Solicitações"
        subtitle="Acompanhe pedidos de orçamento enviados pelo portal do cliente."
        title="Solicitações de orçamento"
      />

      <DataToolbar
        onSubmit={submitSearch}
        search={{
          onChange: setSearch,
          placeholder: "Buscar por cliente, título, descrição ou item",
          value: search,
        }}
      >
        <label className="grid gap-1 text-sm font-medium text-muted">
          Status
          <select
            className="h-10 rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none"
            onChange={(event) => changeStatus(event.target.value as QuoteRequestStatus | "")}
            value={status}
          >
            <option value="">Todos</option>
            <option value="REQUESTED">Solicitada</option>
            <option value="IN_REVIEW">Em análise</option>
            <option value="CONVERTED_TO_QUOTE">Convertida</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </label>
      </DataToolbar>

      <Card className="overflow-hidden">
        {requests.isLoading ? <LoadingState text="Carregando solicitações..." /> : null}
        {requests.isError ? <ErrorState text="Não foi possível carregar os dados." /> : null}
        {requests.data && requests.data.items.length === 0 ? (
          <EmptyState icon={<Search size={20} aria-hidden="true" />} title="Nenhuma solicitação encontrada" />
        ) : null}
        {requests.data && requests.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Solicitação</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {requests.data.items.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell primary>{request.customerName}</TableCell>
                    <TableCell>
                      <p className="font-semibold text-ink">{request.title}</p>
                      <p className="mt-1 text-xs text-muted">{new Date(request.createdAt).toLocaleDateString("pt-BR")}</p>
                    </TableCell>
                    <TableCell>{quoteRequestStatusLabel(request.status)}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <ActionButton aria-label="Ver detalhe" onClick={() => setSelected(request)} type="button">
                          <Eye size={16} aria-hidden="true" />
                        </ActionButton>
                        {request.status === "REQUESTED" ? (
                          <Button
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: request.id, next: "IN_REVIEW" })}
                            size="sm"
                            type="button"
                          >
                            Em análise
                          </Button>
                        ) : null}
                        {request.status === "REQUESTED" || request.status === "IN_REVIEW" ? (
                          <Button
                            disabled={convert.isPending}
                            onClick={() => convert.mutate(request.id)}
                            size="sm"
                            type="button"
                          >
                            <FileText size={15} aria-hidden="true" />
                            Converter
                          </Button>
                        ) : null}
                        {request.status !== "CONVERTED_TO_QUOTE" && request.status !== "CANCELLED" ? (
                          <Button
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: request.id, next: "CANCELLED" })}
                            size="sm"
                            type="button"
                            variant="danger"
                          >
                            Cancelar
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
        {requests.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={(next) => {
              setPage(0);
              setSize(next);
            }}
            page={requests.data.page}
            size={requests.data.size}
            total={requests.data.totalElements}
            totalPages={requests.data.totalPages}
          />
        ) : null}
      </Card>

      {selected ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <section className="w-full max-w-2xl rounded-lg border border-border bg-panel p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{selected.title}</h2>
                <p className="mt-1 text-sm text-muted">{selected.customerName} · {quoteRequestStatusLabel(selected.status)}</p>
              </div>
              <Button onClick={() => setSelected(null)} variant="secondary">Fechar</Button>
            </div>
            {selected.description ? <p className="mt-4 text-sm leading-6 text-muted">{selected.description}</p> : null}
            <div className="mt-5 grid gap-3">
              {selected.items.map((item) => (
                <div className="flex gap-3 rounded-md border border-border p-3" key={item.id}>
                  {item.productId ? (
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border">
                      <ProductImage imageUrl={item.productImageUrlSnapshot} name={item.productNameSnapshot ?? "Produto"} />
                    </div>
                  ) : null}
                  <div>
                    <p className="font-semibold text-ink">
                      {item.productId ? item.productNameSnapshot ?? "Produto selecionado" : "Item manual"}
                    </p>
                    {item.productId ? (
                      <p className="text-sm text-muted">
                        {[item.productSkuSnapshot ? `SKU ${item.productSkuSnapshot}` : null, item.productReferenceSnapshot ? `Ref. ${item.productReferenceSnapshot}` : null]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : (
                      <p className="text-sm text-muted">{item.description}</p>
                    )}
                    <p className="text-sm text-muted">Quantidade: {item.quantity}</p>
                    {item.notes ? <p className="text-sm text-muted">Observação: {item.notes}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}
