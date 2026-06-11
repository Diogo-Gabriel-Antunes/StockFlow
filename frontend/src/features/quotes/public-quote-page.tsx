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
  const finalOrAnswered = quote.data
    ? ["CUSTOMER_APPROVED", "COMPLETED", "REJECTED", "CANCELLED", "EXPIRED"].includes(quote.data.status)
    : false;

  return (
    <main className="min-h-screen bg-[#080b10] px-4 py-8 text-slate-100">
      <div className="mx-auto grid max-w-4xl gap-6">
        {quote.isLoading ? <p className="text-sm text-slate-400">Carregando proposta...</p> : null}
        {quote.isError ? (
          <section className="rounded-lg border border-red-500/30 bg-red-950/50 p-5 text-sm font-medium text-red-100 shadow-[0_18px_45px_rgba(0,0,0,0.25)]">
            Link inválido ou expirado.
          </section>
        ) : null}

        {quote.data ? (
          <>
            <header className="rounded-lg border border-white/10 bg-[#101820] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
              <p className="text-sm font-medium text-cyan-300">{quote.data.companyName}</p>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                {quote.data.companyDocument ? <span>{quote.data.companyDocument}</span> : null}
                {quote.data.companyEmail ? <span>{quote.data.companyEmail}</span> : null}
                {quote.data.companyPhone ? <span>{quote.data.companyPhone}</span> : null}
                {quote.data.companyWhatsapp ? <span>WhatsApp {quote.data.companyWhatsapp}</span> : null}
                {companyLocation(quote.data.companyCity, quote.data.companyState) ? (
                  <span>{companyLocation(quote.data.companyCity, quote.data.companyState)}</span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-white">Proposta {quote.data.code}</h1>
                  <p className="mt-1 text-sm text-slate-300">
                    Cliente: {quote.data.customerName} · {statusLabel(quote.data.status)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Validade: {quote.data.validUntil ?? "-"}
                  </p>
                </div>
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 shadow-[0_10px_28px_rgba(8,145,178,0.18)] transition hover:border-cyan-200/60 hover:bg-cyan-300/15"
                  href={publicQuotePdfUrl(token)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Download size={16} aria-hidden="true" />
                  Baixar PDF
                </a>
              </div>
            </header>

            <section className="overflow-hidden rounded-lg border border-white/10 bg-[#101820] shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Item</th>
                      <th className="px-4 py-3 font-semibold">Qtd.</th>
                      <th className="px-4 py-3 font-semibold">Unitário</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.data.items.map((item) => (
                      <tr className="border-t border-white/10" key={item.id}>
                        <td className="px-4 py-3 font-semibold text-white">{item.description}</td>
                        <td className="px-4 py-3 text-slate-300">{item.quantity}</td>
                        <td className="px-4 py-3 text-slate-300">{currency(item.unitPrice)}</td>
                        <td className="px-4 py-3 text-slate-200">{currency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-4 rounded-lg border border-white/10 bg-[#101820] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.28)] md:grid-cols-[1fr_20rem]">
              <div className="text-sm text-slate-300">
                {quote.data.paymentTerms ? <p>Pagamento: {quote.data.paymentTerms}</p> : null}
                {quote.data.notes ? <p className="mt-1">Observações: {quote.data.notes}</p> : null}
              </div>
              <div className="grid gap-2 text-sm text-slate-300">
                <div className="flex justify-between"><span>Subtotal</span><strong className="text-slate-100">{currency(quote.data.subtotal)}</strong></div>
                <div className="flex justify-between"><span>Desconto</span><strong className="text-slate-100">{currency(quote.data.discount)}</strong></div>
                <div className="flex justify-between"><span>Frete</span><strong className="text-slate-100">{currency(quote.data.shipping)}</strong></div>
                <div className="mt-2 flex justify-between border-t border-white/10 pt-3 text-base text-white"><span>Total</span><strong>{currency(quote.data.total)}</strong></div>
              </div>
            </section>

            {approve.isError || reject.isError ? (
              <div className="rounded-md border border-red-500/30 bg-red-950/50 px-3 py-2 text-sm font-medium text-red-100">
                Não foi possível atualizar a proposta. Verifique a validade do link.
              </div>
            ) : null}

            <footer className="flex flex-wrap justify-end gap-3">
              <button
                className="h-10 rounded-md border border-red-400/30 bg-red-500/10 px-4 text-sm font-semibold text-red-100 shadow-[0_10px_28px_rgba(185,28,28,0.16)] transition hover:border-red-300/60 hover:bg-red-500/15 disabled:opacity-60"
                disabled={reject.isPending || finalOrAnswered}
                onClick={() => reject.mutate()}
                type="button"
              >
                Recusar proposta
              </button>
              <button
                className="h-10 rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(103,232,249,0.22)] transition hover:bg-cyan-200 disabled:opacity-60"
                disabled={approve.isPending || finalOrAnswered}
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

function companyLocation(city: string | null, state: string | null) {
  if (city && state) {
    return `${city}/${state}`;
  }
  return city ?? state;
}
