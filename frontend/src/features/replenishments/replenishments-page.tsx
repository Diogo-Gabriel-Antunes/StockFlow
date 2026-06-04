"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
import {
  listReplenishmentProducts,
  registerReplenishmentEntry,
} from "./replenishment-service";

export function ReplenishmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const replenishments = useQuery({
    queryKey: ["replenishments", token],
    queryFn: () => listReplenishmentProducts(token ?? ""),
    enabled: Boolean(token),
  });

  const registerEntry = useMutation({
    mutationFn: (input: { productId: string; quantity: number }) =>
      registerReplenishmentEntry(token ?? "", {
        productId: input.productId,
        quantity: input.quantity,
        reason: "Reposicao / compra",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["replenishments"] });
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setFormError(null);
    },
    onError: () => setFormError("Não foi possível registrar a reposição."),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  function quantityFor(productId: string, suggested: number) {
    return quantities[productId] ?? String(suggested || 1);
  }

  function submit(productId: string, suggested: number) {
    const quantity = Number(quantityFor(productId, suggested));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError("Informe uma quantidade maior que zero.");
      return;
    }
    registerEntry.mutate({ productId, quantity });
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        action={
          <Button onClick={() => replenishments.refetch()} variant="secondary">
            <RefreshCw size={16} aria-hidden="true" />
            Atualizar
          </Button>
        }
        eyebrow="Reposição / Compras"
        subtitle="Veja produtos no mínimo ou abaixo dele e registre entradas rápidas."
        title="Produtos críticos"
      />

      {formError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {formError}
        </div>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Produtos para reposição</CardTitle>
        </CardHeader>
        {replenishments.isLoading ? (
          <LoadingState text="Carregando produtos críticos..." />
        ) : null}
        {replenishments.isError ? (
          <ErrorState text="Não foi possível carregar a reposição." />
        ) : null}
        {replenishments.data && replenishments.data.length === 0 ? (
          <EmptyState
            description="Produtos no mínimo ou abaixo dele aparecerão aqui para entrada rápida de reposição."
            icon={<ShoppingCart size={20} aria-hidden="true" />}
            title="Nenhum produto crítico no momento"
          />
        ) : null}
        {replenishments.data && replenishments.data.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>Estoque</TableHeaderCell>
                  <TableHeaderCell>Mínimo</TableHeaderCell>
                  <TableHeaderCell>Compra sugerida</TableHeaderCell>
                  <TableHeaderCell>Entrada</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {replenishments.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-muted">{product.sku ?? product.category ?? "-"}</p>
                    </TableCell>
                    <TableCell>
                      {product.stockQuantity} {product.unit}
                    </TableCell>
                    <TableCell>
                      {product.minimumStock} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge tone={product.suggestedPurchaseQuantity > 0 ? "warning" : "neutral"}>
                        {product.suggestedPurchaseQuantity > 0
                          ? `${product.suggestedPurchaseQuantity} ${product.unit}`
                          : "Sem sugestão"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-56 items-center gap-2">
                        <label className="sr-only" htmlFor={`quantity-${product.id}`}>
                          Quantidade para {product.name}
                        </label>
                        <input
                          className="h-10 w-24 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
                          id={`quantity-${product.id}`}
                          min="0.001"
                          onChange={(event) =>
                            setQuantities((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                          step="0.001"
                          type="number"
                          value={quantityFor(product.id, product.suggestedPurchaseQuantity)}
                        />
                        <Button
                          className="px-3"
                          disabled={registerEntry.isPending}
                          onClick={() => submit(product.id, product.suggestedPurchaseQuantity)}
                          size="md"
                          type="button"
                        >
                          <ShoppingCart size={16} aria-hidden="true" />
                          Registrar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
      </Card>
    </AppLayout>
  );
}
