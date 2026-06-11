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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { appToast, getApiErrorMessage } from "@/lib/toast";
import {
  approveQuote,
  cancelQuote,
  completeQuote,
  generatePublicQuoteLink,
  getQuote,
  privateQuotePdfUrl,
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
  const [completeOpen, setCompleteOpen] = useState(false);
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const quote = useQuery({
    queryKey: ["quotes", id, token],
    queryFn: () => getQuote(token ?? "", id),
    enabled: Boolean(token && id),
  });

  const changeStatus = useMutation({
    mutationFn: (action: "send" | "approve" | "reject" | "cancel") => {
      if (action === "send") {
        return sendQuote(token ?? "", id);
      }
      if (action === "approve") {
        return approveQuote(token ?? "", id);
      }
      if (action === "cancel") {
        return cancelQuote(token ?? "", id);
      }
      return rejectQuote(token ?? "", id);
    },
    onSuccess: (_data, action) => {
      const messages = {
        send: "Orçamento enviado com sucesso.",
        approve: "Orçamento marcado como aprovado pelo cliente.",
        reject: "Proposta recusada.",
        cancel: "Orçamento cancelado com sucesso.",
      };
      appToast.success(messages[action]);
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível atualizar o orçamento."));
    },
  });

  const complete = useMutation({
    mutationFn: () => completeQuote(token ?? "", id),
    onSuccess: () => {
      appToast.success("Orçamento concluído e estoque baixado com sucesso.");
      setCompleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível concluir o orçamento."));
    },
  });

  const generateLink = useMutation({
    mutationFn: () => generatePublicQuoteLink(token ?? "", id),
    onSuccess: (data) => {
      setPublicLink(data);
      appToast.success("Link público gerado com sucesso.");
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível gerar o link público."));
    },
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
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-white px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800"
                  href={privateQuotePdfUrl(quote.data.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Download size={16} aria-hidden="true" />
                  Baixar PDF
                </a>
                {quote.data.status === "DRAFT" ? (
                  <>
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
                  </>
                ) : null}
                {quote.data.status === "SENT" ? (
                  <>
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
                      onClick={() => changeStatus.mutate("approve")}
                    >
                      Marcar como aprovado pelo cliente
                    </Button>
                    <Button
                      disabled={changeStatus.isPending}
                      onClick={() => changeStatus.mutate("reject")}
                      variant="danger"
                    >
                      Recusar
                    </Button>
                  </>
                ) : null}
                {quote.data.status === "CUSTOMER_APPROVED" ? (
                  <Button
                    disabled={complete.isPending}
                    onClick={() => setCompleteOpen(true)}
                  >
                    Concluir orçamento
                  </Button>
                ) : null}
                {["DRAFT", "SENT", "CUSTOMER_APPROVED"].includes(quote.data.status) ? (
                  <Button
                    disabled={changeStatus.isPending}
                    onClick={() => changeStatus.mutate("cancel")}
                    variant="danger"
                  >
                    Cancelar
                  </Button>
                ) : null}
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
                  rel="noreferrer"
                  target="_blank"
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
          <ConfirmDialog
            confirmLabel="Concluir orçamento"
            description="Esta ação finalizará o orçamento, baixará o estoque dos produtos e não poderá ser desfeita facilmente. Deseja continuar?"
            loading={complete.isPending}
            loadingLabel="Concluindo..."
            onCancel={() => setCompleteOpen(false)}
            onConfirm={() => complete.mutate()}
            open={completeOpen}
            title="Concluir orçamento"
            variant="warning"
          />
        </div>
      ) : null}
    </AppLayout>
  );
}
