"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Link2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import {
  approveQuote,
  generatePublicQuoteLink,
  getQuote,
  publicQuotePdfUrl,
  rejectQuote,
  sendQuote,
} from "./quote-service";
import { currency, statusLabel } from "./quotes-page";
import type { PublicQuoteLink } from "./types";

type QuoteDetailPageProps = {
  id: string;
};

export function QuoteDetailPage({ id }: QuoteDetailPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [publicLink, setPublicLink] = useState<PublicQuoteLink | null>(null);
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const quote = useQuery({
    queryKey: ["quotes", id, token],
    queryFn: () => getQuote(token ?? "", id),
    enabled: Boolean(token && id),
  });

  const changeStatus = useMutation({
    mutationFn: (action: "send" | "approve" | "reject") => {
      if (action === "send") {
        return sendQuote(token ?? "", id);
      }
      if (action === "approve") {
        return approveQuote(token ?? "", id);
      }
      return rejectQuote(token ?? "", id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
  });

  const generateLink = useMutation({
    mutationFn: () => generatePublicQuoteLink(token ?? "", id),
    onSuccess: (data) => setPublicLink(data),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <AppLayout>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-primary" href="/quotes">
          Voltar para orçamentos
        </Link>
      </div>

      {quote.isLoading ? <p className="text-sm text-muted">Carregando orçamento...</p> : null}
      {quote.isError ? (
        <p className="text-sm font-medium text-red-700">Não foi possível carregar o orçamento.</p>
      ) : null}

      {quote.data ? (
        <div className="grid gap-6">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-primary">Orçamento</p>
              <h1 className="text-2xl font-semibold text-ink">{quote.data.code}</h1>
              <p className="mt-1 text-sm text-muted">
                {quote.data.customerName} · {statusLabel(quote.data.status)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50 disabled:opacity-60"
                disabled={generateLink.isPending}
                onClick={() => generateLink.mutate()}
                type="button"
              >
                <Link2 size={16} aria-hidden="true" />
                Gerar link público
              </button>
              <button
                className="h-10 rounded-md border border-border bg-white px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50 disabled:opacity-60"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate("send")}
                type="button"
              >
                Enviar
              </button>
              <button
                className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:opacity-60"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate("approve")}
                type="button"
              >
                Aprovar
              </button>
              <button
                className="h-10 rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-subtle transition hover:bg-red-50 disabled:opacity-60"
                disabled={changeStatus.isPending}
                onClick={() => changeStatus.mutate("reject")}
                type="button"
              >
                Recusar
              </button>
            </div>
          </header>

          {publicLink ? (
            <section className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-ink">
              <p className="font-semibold">Link público da proposta</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a className="break-all font-medium text-primary underline" href={publicLink.url}>
                  {publicLink.url}
                </a>
                <a
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink transition hover:bg-slate-50"
                  href={publicQuotePdfUrl(publicLink.token)}
                >
                  <Download size={16} aria-hidden="true" />
                  PDF
                </a>
              </div>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Qtd.</th>
                    <th className="px-4 py-3 font-semibold">Unitário</th>
                    <th className="px-4 py-3 font-semibold">Desconto</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.data.items.map((item) => (
                    <tr className="border-t border-border" key={item.id}>
                      <td className="px-4 py-3 font-semibold text-ink">{item.description}</td>
                      <td className="px-4 py-3 text-muted">{item.quantity}</td>
                      <td className="px-4 py-3 text-muted">{currency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-muted">{currency(item.discount)}</td>
                      <td className="px-4 py-3 text-muted">{currency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-2 rounded-lg border border-border bg-panel p-5 text-sm shadow-subtle md:ml-auto md:w-80">
            <div className="flex justify-between"><span>Subtotal</span><strong>{currency(quote.data.subtotal)}</strong></div>
            <div className="flex justify-between"><span>Desconto</span><strong>{currency(quote.data.discount)}</strong></div>
            <div className="flex justify-between"><span>Frete</span><strong>{currency(quote.data.shipping)}</strong></div>
            <div className="flex justify-between text-base text-ink"><span>Total</span><strong>{currency(quote.data.total)}</strong></div>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}
