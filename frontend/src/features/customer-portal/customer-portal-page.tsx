"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Download, FilePlus2, FileText, History, Send, XCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { currency } from "@/features/quotes/quotes-page";
import {
  approvePortalQuote,
  cancelPortalQuoteRequest,
  getCustomerPortal,
  listPortalQuoteRequests,
  listPortalQuotes,
  portalQuotePdfUrl,
  rejectPortalQuote,
} from "./customer-portal-service";
import type { CustomerPortalQuote, QuoteRequest } from "./types";

type CustomerPortalPageProps = {
  token: string;
};

export function CustomerPortalPage({ token }: CustomerPortalPageProps) {
  const queryClient = useQueryClient();
  const [quoteToApprove, setQuoteToApprove] = useState<CustomerPortalQuote | null>(null);
  const [quoteToReject, setQuoteToReject] = useState<CustomerPortalQuote | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [requestToCancel, setRequestToCancel] = useState<QuoteRequest | null>(null);

  const portal = useQuery({
    queryKey: ["customer-portal", token],
    queryFn: () => getCustomerPortal(token),
    enabled: Boolean(token),
    retry: false,
  });
  const openQuotes = useQuery({
    queryKey: ["customer-portal-quotes", token, "open"],
    queryFn: () => listPortalQuotes(token, "open"),
    enabled: Boolean(token),
  });
  const completedQuotes = useQuery({
    queryKey: ["customer-portal-quotes", token, "completed"],
    queryFn: () => listPortalQuotes(token, "completed"),
    enabled: Boolean(token),
  });
  const requests = useQuery({
    queryKey: ["customer-portal-requests", token],
    queryFn: () => listPortalQuoteRequests(token),
    enabled: Boolean(token),
  });

  const approve = useMutation({
    mutationFn: (quoteId: string) => approvePortalQuote(token, quoteId),
    onSuccess: () => {
      setQuoteToApprove(null);
      appToast.success("Proposta aprovada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["customer-portal"] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível aprovar a proposta.")),
  });

  const reject = useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason: string }) =>
      rejectPortalQuote(token, quoteId, reason),
    onSuccess: () => {
      setQuoteToReject(null);
      setRejectReason("");
      appToast.success("Proposta recusada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["customer-portal"] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível recusar a proposta.")),
  });

  const cancelRequest = useMutation({
    mutationFn: (requestId: string) => cancelPortalQuoteRequest(token, requestId),
    onSuccess: () => {
      setRequestToCancel(null);
      appToast.success("Solicitação cancelada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["customer-portal-requests", token] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível cancelar a solicitação.")),
  });

  const isLoading = portal.isLoading || openQuotes.isLoading || completedQuotes.isLoading || requests.isLoading;
  const isError = portal.isError;

  if (isLoading) {
    return <PublicShell><p className="text-sm text-muted">Carregando portal...</p></PublicShell>;
  }

  if (isError || !portal.data) {
    return (
      <PublicShell>
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-6 text-red-300">
          <h1 className="text-lg font-semibold">Link inválido ou expirado.</h1>
          <p className="mt-2 text-sm">Verifique o link recebido e tente novamente.</p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <header className="grid gap-5 border-b border-border pb-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-semibold text-primary">{portal.data.company.tradeName}</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Portal do Cliente</h1>
          <p className="mt-2 text-sm text-muted">
            {portal.data.customer.name}
            {portal.data.customer.document ? ` · ${portal.data.customer.document}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted">
            {[portal.data.company.email, portal.data.company.phone, portal.data.company.whatsapp, companyLocation(portal.data.company.city, portal.data.company.state)]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <ButtonLink href={`/customer-portal/${token}/quote-requests/new`}>
            <FilePlus2 size={17} aria-hidden="true" />
            Nova solicitação
          </ButtonLink>
          <ButtonLink href={`/customer-portal/${token}/products`} variant="secondary">
            <Boxes size={17} aria-hidden="true" />
            Catálogo
          </ButtonLink>
        </div>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric label="Propostas em aberto" value={portal.data.summary.openQuotes} />
        <Metric label="Histórico" value={portal.data.summary.completedQuotes} />
        <Metric label="Solicitações" value={portal.data.summary.quoteRequests} />
      </section>

      <QuoteList
        empty="Nenhuma proposta em aberto."
        icon={<FileText size={18} aria-hidden="true" />}
        quotes={openQuotes.data?.content ?? []}
        title="Propostas em aberto"
        token={token}
        onApprove={setQuoteToApprove}
        onReject={setQuoteToReject}
      />

      <QuoteList
        empty="Nenhuma proposta concluída."
        icon={<History size={18} aria-hidden="true" />}
        quotes={completedQuotes.data?.content ?? []}
        title="Histórico"
        token={token}
      />

      <section className="rounded-lg border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold text-ink">Solicitações de orçamento</h2>
        </div>
        {(requests.data ?? []).length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhuma solicitação criada.</p>
        ) : (
          <div className="divide-y divide-border">
            {(requests.data ?? []).map((request) => (
              <div className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between" key={request.id}>
                <div>
                  <p className="font-semibold text-ink">{request.title}</p>
                  <p className="text-sm text-muted">{quoteRequestStatusLabel(request.status)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ButtonLink href={`/customer-portal/${token}/quote-requests/${request.id}`} size="sm">
                    Ver
                  </ButtonLink>
                  {request.canEdit ? (
                    <ButtonLink href={`/customer-portal/${token}/quote-requests/${request.id}`} size="sm" variant="secondary">
                      Editar
                    </ButtonLink>
                  ) : null}
                  {request.canCancel ? (
                    <Button onClick={() => setRequestToCancel(request)} size="sm" variant="danger">
                      Cancelar
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        confirmLabel="Aprovar proposta"
        description="Após a aprovação, a empresa dará continuidade ao atendimento."
        loading={approve.isPending}
        loadingLabel="Aprovando..."
        onCancel={() => setQuoteToApprove(null)}
        onConfirm={() => {
          if (quoteToApprove) {
            approve.mutate(quoteToApprove.id);
          }
        }}
        open={Boolean(quoteToApprove)}
        title="Deseja aprovar esta proposta?"
      />

      {quoteToReject ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-ink">Recusar proposta</h2>
            <p className="mt-2 text-sm text-muted">Informe um motivo, se desejar.</p>
            <textarea
              className="mt-4 min-h-28 w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm text-ink outline-none focus:border-primary"
              onChange={(event) => setRejectReason(event.target.value)}
              value={rejectReason}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button disabled={reject.isPending} onClick={() => setQuoteToReject(null)} variant="secondary">
                Cancelar
              </Button>
              <Button
                disabled={reject.isPending}
                onClick={() => reject.mutate({ quoteId: quoteToReject.id, reason: rejectReason })}
                variant="danger"
              >
                {reject.isPending ? "Recusando..." : "Confirmar recusa"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Cancelar solicitação"
        description="Esta solicitação será cancelada e não poderá ser editada pelo portal."
        loading={cancelRequest.isPending}
        loadingLabel="Cancelando..."
        onCancel={() => setRequestToCancel(null)}
        onConfirm={() => {
          if (requestToCancel) {
            cancelRequest.mutate(requestToCancel.id);
          }
        }}
        open={Boolean(requestToCancel)}
        title="Cancelar solicitação?"
        variant="danger"
      />
    </PublicShell>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-page px-4 py-8 text-ink">
      <div className="mx-auto grid max-w-6xl gap-6">{children}</div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function QuoteList({
  empty,
  icon,
  onApprove,
  onReject,
  quotes,
  title,
  token,
}: {
  empty: string;
  icon: React.ReactNode;
  onApprove?: (quote: CustomerPortalQuote) => void;
  onReject?: (quote: CustomerPortalQuote) => void;
  quotes: CustomerPortalQuote[];
  title: string;
  token: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-panel">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        {icon}
        <h2 className="font-semibold text-ink">{title}</h2>
      </div>
      {quotes.length === 0 ? (
        <p className="p-5 text-sm text-muted">{empty}</p>
      ) : (
        <div className="divide-y divide-border">
          {quotes.map((quote) => (
            <div className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center lg:justify-between" key={quote.id}>
              <div>
                <p className="font-semibold text-ink">{quote.code}</p>
                <p className="text-sm text-muted">
                  {quote.statusLabel} · {quote.validUntil ? `Validade ${quote.validUntil}` : "Sem validade"} · {currency(quote.total)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ButtonLink href={`/customer-portal/${token}/quotes/${quote.id}`} size="sm">
                  Ver proposta
                </ButtonLink>
                <a
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold text-ink transition hover:bg-slate-800"
                  href={portalQuotePdfUrl(token, quote.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Download size={15} aria-hidden="true" />
                  PDF
                </a>
                {quote.canApprove && onApprove ? (
                  <Button onClick={() => onApprove(quote)} size="sm">
                    <Send size={15} aria-hidden="true" />
                    Aprovar
                  </Button>
                ) : null}
                {quote.canReject && onReject ? (
                  <Button onClick={() => onReject(quote)} size="sm" variant="danger">
                    <XCircle size={15} aria-hidden="true" />
                    Recusar
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function quoteRequestStatusLabel(status: string) {
  const labels: Record<string, string> = {
    REQUESTED: "Solicitada",
    IN_REVIEW: "Em análise",
    CONVERTED_TO_QUOTE: "Convertida em orçamento",
    CANCELLED: "Cancelada",
  };
  return labels[status] ?? status;
}

function companyLocation(city: string | null, state: string | null) {
  if (city && state) {
    return `${city}/${state}`;
  }
  return city ?? state;
}
