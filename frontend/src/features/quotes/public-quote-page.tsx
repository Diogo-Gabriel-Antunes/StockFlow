"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import {
  approvePublicQuote,
  getPublicQuote,
  publicQuotePdfUrl,
  rejectPublicQuote,
} from "./quote-service";
import { currency, statusLabel } from "./quotes-page";

type PublicQuotePageProps = {
  token: string;
};

export function PublicQuotePage({ token }: PublicQuotePageProps) {
  const queryClient = useQueryClient();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const quote = useQuery({
    queryKey: ["public-quote", token],
    queryFn: () => getPublicQuote(token),
    enabled: Boolean(token),
    retry: false,
  });

  const approve = useMutation({
    mutationFn: () => approvePublicQuote(token),
    onSuccess: () => {
      setApproveOpen(false);
      appToast.success("Proposta aprovada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["public-quote", token] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível aprovar a proposta.")),
  });

  const reject = useMutation({
    mutationFn: () => rejectPublicQuote(token, rejectReason),
    onSuccess: () => {
      setRejectOpen(false);
      setRejectReason("");
      appToast.success("Proposta recusada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["public-quote", token] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível recusar a proposta.")),
  });

  if (quote.isLoading) {
    return <main className="min-h-screen bg-page p-8 text-sm text-muted">Carregando proposta...</main>;
  }

  if (quote.isError || !quote.data) {
    return (
      <main className="min-h-screen bg-page px-4 py-8">
        <section className="mx-auto max-w-3xl rounded-lg border border-red-900/60 bg-red-950/40 p-6 text-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          <h1 className="text-lg font-semibold">Link inválido ou expirado.</h1>
          <p className="mt-2 text-sm">Verifique o link recebido e tente novamente.</p>
        </section>
      </main>
    );
  }

  const canDecide = quote.data.status === "SENT";

  return (
    <main className="min-h-screen bg-page px-4 py-8 text-ink">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="rounded-lg border border-border bg-panel p-6 shadow-subtle">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">{quote.data.companyName}</p>
              <h1 className="mt-1 text-3xl font-semibold text-ink">Proposta {quote.data.code}</h1>
              <p className="mt-2 text-sm text-muted">
                Cliente: {quote.data.customerName} · {statusLabel(quote.data.status)}
              </p>
              <p className="mt-1 text-sm text-muted">
                {quote.data.validUntil ? `Validade: ${quote.data.validUntil}` : "Sem validade definida"}
              </p>
              <p className="mt-2 text-sm text-muted">
                {[quote.data.companyDocument, quote.data.companyEmail, quote.data.companyPhone, quote.data.companyWhatsapp, companyLocation(quote.data.companyCity, quote.data.companyState)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <a
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink transition hover:bg-slate-900 dark:hover:bg-slate-800"
              href={publicQuotePdfUrl(token)}
              rel="noreferrer"
              target="_blank"
            >
              <Download size={16} aria-hidden="true" />
              Baixar PDF
            </a>
          </div>
        </header>

        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-muted dark:bg-slate-900/70">
                <tr>
                  <th className="px-5 py-3 font-semibold">Item</th>
                  <th className="px-5 py-3 font-semibold">Qtd.</th>
                  <th className="px-5 py-3 font-semibold">Unitário</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {quote.data.items.map((item) => (
                  <tr className="border-t border-border" key={item.id}>
                    <td className="px-5 py-4 font-semibold text-ink">{item.description}</td>
                    <td className="px-5 py-4 text-muted">{item.quantity}</td>
                    <td className="px-5 py-4 text-muted">{currency(item.unitPrice)}</td>
                    <td className="px-5 py-4 font-semibold text-ink">{currency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-5 rounded-lg border border-border bg-panel p-6 shadow-subtle md:grid-cols-[1fr_20rem]">
          <div className="text-sm leading-6 text-muted">
            {quote.data.paymentTerms ? <p><strong>Pagamento:</strong> {quote.data.paymentTerms}</p> : null}
            {quote.data.notes ? <p className="mt-2"><strong>Observações:</strong> {quote.data.notes}</p> : null}
            <StatusMessage status={quote.data.status} />
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

        {canDecide ? (
          <footer className="flex flex-wrap justify-end gap-2">
            <Button onClick={() => setRejectOpen(true)} variant="danger">Recusar proposta</Button>
            <Button onClick={() => setApproveOpen(true)}>Aprovar proposta</Button>
          </footer>
        ) : null}
      </div>

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
              className="mt-4 min-h-28 w-full rounded-md border border-border bg-panel px-3 py-2 text-sm text-ink outline-none placeholder:text-slate-400 focus:border-primary dark:bg-slate-950/40 dark:placeholder:text-muted"
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
    </main>
  );
}

function StatusMessage({ status }: { status: string }) {
  const message = {
    CUSTOMER_APPROVED: "Proposta aprovada. Aguardando conclusão pela empresa.",
    COMPLETED: "Proposta concluída.",
    REJECTED: "Proposta recusada.",
    CANCELLED: "Proposta cancelada.",
    EXPIRED: "Proposta expirada.",
  }[status];
  return message ? (
    <p className="mt-3 rounded-md bg-slate-800 px-3 py-2 font-medium text-slate-300 dark:bg-slate-900 dark:text-slate-200">{message}</p>
  ) : null;
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <strong className="text-ink">{value}</strong>
    </div>
  );
}

function companyLocation(city: string | null, state: string | null) {
  if (city && state) {
    return `${city}/${state}`;
  }
  return city ?? state;
}
