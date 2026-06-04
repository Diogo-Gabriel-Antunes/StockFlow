"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Link2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import {
  DataTable,
  ErrorState,
  LoadingState,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import {
  approveQuote,
  generatePublicQuoteLink,
  getQuote,
  publicQuotePdfUrl,
  rejectQuote,
  sendQuote,
} from "./quote-service";
import { currency, statusLabel, statusTone } from "./quotes-page";
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
    <AppLayout maxWidth="wide">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-primary" href="/quotes">
          Voltar para orçamentos
        </Link>
      </div>

      {quote.isLoading ? <LoadingState text="Carregando orçamento..." /> : null}
      {quote.isError ? (
        <ErrorState text="Não foi possível carregar o orçamento." />
      ) : null}

      {quote.data ? (
        <div className="grid gap-6">
          <PageHeader
            action={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  disabled={generateLink.isPending}
                  onClick={() => generateLink.mutate()}
                  variant="secondary"
                >
                  <Link2 size={16} aria-hidden="true" />
                  Gerar link público
                </Button>
                <Button
                  disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate("send")}
                  variant="secondary"
                >
                  Enviar
                </Button>
                <Button
                  disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate("approve")}
                >
                  Aprovar
                </Button>
                <Button
                  disabled={changeStatus.isPending}
                  onClick={() => changeStatus.mutate("reject")}
                  variant="danger"
                >
                  Recusar
                </Button>
              </div>
            }
            eyebrow="Orçamento"
            subtitle={quote.data.customerName}
            title={quote.data.code}
          />

          <div className="-mt-5">
            <Badge tone={statusTone(quote.data.status)}>
              {statusLabel(quote.data.status)}
            </Badge>
          </div>

          {publicLink ? (
            <Card className="border-blue-200 bg-blue-50/70 dark:border-blue-900/60 dark:bg-blue-950/30">
              <CardBody>
              <p className="font-semibold">Link público da proposta</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <a className="break-all font-medium text-primary underline" href={publicLink.url}>
                  {publicLink.url}
                </a>
                <a
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  href={publicQuotePdfUrl(publicLink.token)}
                >
                  <Download size={16} aria-hidden="true" />
                  PDF
                </a>
              </div>
              </CardBody>
            </Card>
          ) : null}

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Itens do orçamento</CardTitle>
            </CardHeader>
            <TableShell>
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Item</TableHeaderCell>
                    <TableHeaderCell>Qtd.</TableHeaderCell>
                    <TableHeaderCell>Unitário</TableHeaderCell>
                    <TableHeaderCell>Desconto</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {quote.data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell primary>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{currency(item.unitPrice)}</TableCell>
                      <TableCell>{currency(item.discount)}</TableCell>
                      <TableCell>{currency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </DataTable>
            </TableShell>
          </Card>

          <Card className="grid gap-2 p-5 text-sm md:ml-auto md:w-96">
            <div className="flex justify-between"><span>Subtotal</span><strong>{currency(quote.data.subtotal)}</strong></div>
            <div className="flex justify-between"><span>Desconto</span><strong>{currency(quote.data.discount)}</strong></div>
            <div className="flex justify-between"><span>Frete</span><strong>{currency(quote.data.shipping)}</strong></div>
            <div className="flex justify-between text-base text-ink"><span>Total</span><strong>{currency(quote.data.total)}</strong></div>
          </Card>
        </div>
      ) : null}
    </AppLayout>
  );
}
