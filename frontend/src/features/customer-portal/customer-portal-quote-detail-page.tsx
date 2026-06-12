"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { currency } from "@/features/quotes/quotes-page";
import {
  approvePortalQuote,
  getPortalQuote,
  portalQuotePdfUrl,
  rejectPortalQuote,
} from "./customer-portal-service";
import { PublicShell } from "./customer-portal-page";

export function CustomerPortalQuoteDetailPage({ quoteId, token }: { quoteId: string; token: string }) {
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const quote = useQuery({
    queryKey: ["customer-portal-quote", token, quoteId],
    queryFn: () => getPortalQuote(token, quoteId),
    enabled: Boolean(token && quoteId),
    retry: false,
  });

  const approve = useMutation({
    mutationFn: () => approvePortalQuote(token, quoteId),
    onSuccess: () => {
      setApproveOpen(false);
      appToast.success("Proposta aprovada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["customer-portal-quote", token, quoteId] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível aprovar a proposta.")),
  });

  const reject = useMutation({
    mutationFn: () => rejectPortalQuote(token, quoteId, rejectReason),
    onSuccess: () => {
      setRejectOpen(false);
      setRejectReason("");
      appToast.success("Proposta recusada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["customer-portal-quote", token, quoteId] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível recusar a proposta.")),
  });

  if (quote.isLoading) {
    return <PublicShell><p className="text-sm text-muted">Carregando proposta...</p></PublicShell>;
  }

  if (quote.isError || !quote.data) {
    return (
      <PublicShell>
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-6 text-red-300">
          <h1 className="text-lg font-semibold">Não foi possível carregar os dados.</h1>
          <p className="mt-2 text-sm">Verifique o link recebido e tente novamente.</p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{quote.data.statusLabel}</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Proposta {quote.data.code}</h1>
          <p className="mt-2 text-sm text-muted">
            {quote.data.validUntil ? `Validade ${quote.data.validUntil}` : "Sem validade definida"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/customer-portal/${token}`} variant="secondary">Voltar ao portal</ButtonLink>
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink transition hover:bg-slate-800"
            href={portalQuotePdfUrl(token, quoteId)}
            rel="noreferrer"
            target="_blank"
          >
            <Download size={16} aria-hidden="true" />
            Baixar PDF
          </a>
        </div>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-panel">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-slate-900/70 text-xs uppercase text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Qtd.</th>
                <th className="px-5 py-3 font-semibold">Unitário</th>
                <th className="px-5 py-3 font-semibold">Desconto</th>
                <th className="px-5 py-3 font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.data.items.map((item) => (
                <tr className="border-t border-border" key={item.id}>
                  <td className="px-5 py-4 font-semibold text-ink">{item.description}</td>
                  <td className="px-5 py-4 text-muted">{item.quantity}</td>
                  <td className="px-5 py-4 text-muted">{currency(item.unitPrice)}</td>
                  <td className="px-5 py-4 text-muted">{currency(item.discount)}</td>
                  <td className="px-5 py-4 font-semibold text-ink">{currency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-5 rounded-lg border border-border bg-panel p-5 lg:grid-cols-[1fr_20rem]">
        <div className="text-sm leading-6 text-muted">
          {quote.data.paymentTerms ? <p><strong>Pagamento:</strong> {quote.data.paymentTerms}</p> : null}
          {quote.data.notes ? <p className="mt-2"><strong>Observações:</strong> {quote.data.notes}</p> : null}
          {quote.data.status === "CUSTOMER_APPROVED" ? (
            <p className="mt-3 rounded-md bg-cyan-950/40 px-3 py-2 font-medium text-cyan-300">
              Proposta aprovada. Aguardando conclusão pela empresa.
            </p>
          ) : null}
          {quote.data.status === "COMPLETED" ? (
            <p className="mt-3 rounded-md bg-emerald-950/40 px-3 py-2 font-medium text-emerald-300">Proposta concluída.</p>
          ) : null}
          {quote.data.status === "REJECTED" ? (
            <p className="mt-3 rounded-md bg-red-950/40 px-3 py-2 font-medium text-red-300">Proposta recusada.</p>
          ) : null}
        </div>
        <div className="grid gap-2 text-sm text-muted">
          <Line label="Subtotal" value={currency(quote.data.subtotal)} />
          <Line label="Desconto" value={currency(quote.data.discount)} />
          <Line label="Frete" value={currency(quote.data.shipping)} />
          <div className="mt-2 flex justify-between border-t border-border pt-3 text-base text-ink">
            <span>Total</span>
            <strong>{currency(quote.data.total)}</strong>
          </div>
        </div>
      </section>

      {quote.data.canApprove || quote.data.canReject ? (
        <footer className="flex flex-wrap justify-end gap-2">
          {quote.data.canReject ? <Button onClick={() => setRejectOpen(true)} variant="danger">Recusar proposta</Button> : null}
          {quote.data.canApprove ? <Button onClick={() => setApproveOpen(true)}>Aprovar proposta</Button> : null}
        </footer>
      ) : null}

      <ConfirmDialog
        confirmLabel="Aprovar proposta"
        description="Após a aprovação, a empresa dará continuidade ao atendimento."
        loading={approve.isPending}
        loadingLabel="Aprovando..."
        onCancel={() => setApproveOpen(false)}
        onConfirm={() => approve.mutate()}
        open={approveOpen}
        title="Deseja aprovar esta proposta?"
      />

      {rejectOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border border-border bg-panel p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-ink">Recusar proposta</h2>
            <textarea
              className="mt-4 min-h-28 w-full rounded-md border border-border bg-slate-950/40 px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="Motivo da recusa, opcional"
              value={rejectReason}
            />
            <div className="mt-5 flex justify-end gap-2">
              <Button disabled={reject.isPending} onClick={() => setRejectOpen(false)} variant="secondary">Cancelar</Button>
              <Button disabled={reject.isPending} onClick={() => reject.mutate()} variant="danger">
                {reject.isPending ? "Recusando..." : "Confirmar recusa"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </PublicShell>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}
