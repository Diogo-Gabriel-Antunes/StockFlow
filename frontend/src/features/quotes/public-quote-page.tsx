"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download } from "lucide-react";
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
  const quote = useQuery({
    queryKey: ["public-quote", token],
    queryFn: () => getPublicQuote(token),
    enabled: Boolean(token),
  });

  const approve = useMutation({
    mutationFn: () => approvePublicQuote(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public-quote", token] }),
  });
  const reject = useMutation({
    mutationFn: () => rejectPublicQuote(token),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["public-quote", token] }),
  });

  return (
    <main className="min-h-screen bg-page px-4 py-8">
      <div className="mx-auto grid max-w-4xl gap-6">
        {quote.isLoading ? <p className="text-sm text-muted">Carregando proposta...</p> : null}
        {quote.isError ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800">
            Link inválido ou expirado.
          </section>
        ) : null}

        {quote.data ? (
          <>
            <header className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
              <p className="text-sm font-medium text-primary">{quote.data.companyName}</p>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-ink">Proposta {quote.data.code}</h1>
                  <p className="mt-1 text-sm text-muted">
                    Cliente: {quote.data.customerName} · {statusLabel(quote.data.status)}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    Validade: {quote.data.validUntil ?? "-"}
                  </p>
                </div>
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
                  href={publicQuotePdfUrl(token)}
                >
                  <Download size={16} aria-hidden="true" />
                  Baixar PDF
                </a>
              </div>
            </header>

            <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Qtd.</th>
                      <th className="px-4 py-3 font-semibold">Unitário</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.data.items.map((item) => (
                      <tr className="border-t border-border" key={item.id}>
                        <td className="px-4 py-3 font-semibold text-ink">{item.description}</td>
                        <td className="px-4 py-3 text-muted">{item.quantity}</td>
                        <td className="px-4 py-3 text-muted">{currency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-muted">{currency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 rounded-lg border border-border bg-panel p-5 shadow-subtle md:grid-cols-[1fr_20rem]">
              <div className="text-sm text-muted">
                {quote.data.paymentTerms ? <p>Pagamento: {quote.data.paymentTerms}</p> : null}
                {quote.data.notes ? <p className="mt-1">Observações: {quote.data.notes}</p> : null}
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><strong>{currency(quote.data.subtotal)}</strong></div>
                <div className="flex justify-between"><span>Desconto</span><strong>{currency(quote.data.discount)}</strong></div>
                <div className="flex justify-between"><span>Frete</span><strong>{currency(quote.data.shipping)}</strong></div>
                <div className="flex justify-between text-base text-ink"><span>Total</span><strong>{currency(quote.data.total)}</strong></div>
              </div>
            </section>

            {approve.isError || reject.isError ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                Não foi possível atualizar a proposta. Verifique a validade do link.
              </div>
            ) : null}

            <footer className="flex flex-wrap justify-end gap-3">
              <button
                className="h-10 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-subtle transition hover:bg-red-50 disabled:opacity-60"
                disabled={reject.isPending || quote.data.status === "APPROVED"}
                onClick={() => reject.mutate()}
                type="button"
              >
                Recusar proposta
              </button>
              <button
                className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:opacity-60"
                disabled={approve.isPending || quote.data.status === "APPROVED"}
                onClick={() => approve.mutate()}
                type="button"
              >
                Aprovar proposta
              </button>
            </footer>
          </>
        ) : null}
      </div>
    </main>
  );
}
