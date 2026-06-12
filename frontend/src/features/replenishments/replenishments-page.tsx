"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Modal } from "@/components/ui/Modal";
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
import { TextField } from "@/components/ui/text-field";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import {
  listReplenishmentProducts,
  registerReplenishmentEntry,
} from "./replenishment-service";
import type { ReplenishmentProduct } from "./types";

const DEFAULT_REASON = "Reposição de estoque";
type StatusFilter = "" | "OUT_OF_STOCK" | "LOW_STOCK";

export function ReplenishmentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [selectedProduct, setSelectedProduct] = useState<ReplenishmentProduct | null>(null);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [formError, setFormError] = useState<string | null>(null);

  const replenishments = useQuery({
    queryKey: ["replenishments", submittedSearch, status, page, size, token],
    queryFn: () => listReplenishmentProducts(token ?? "", { page, search: submittedSearch, size, status }),
    enabled: Boolean(token),
  });

  const registerEntry = useMutation({
    mutationFn: () => {
      if (!selectedProduct) {
        throw new Error("Produto não selecionado.");
      }
      return registerReplenishmentEntry(token ?? "", {
        productId: selectedProduct.productId ?? selectedProduct.id,
        quantity: Number(quantity),
        reason,
      });
    },
    onSuccess: async () => {
      resetModalState();
      appToast.success("Reposição registrada com sucesso.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["replenishments"] }),
        queryClient.invalidateQueries({ queryKey: ["stock"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
      ]);
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível registrar a reposição."));
    },
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (replenishments.isError) {
      appToast.error("Não foi possível carregar os produtos para reposição.");
    }
  }, [replenishments.isError]);

  const modalTitle = useMemo(() => {
    return selectedProduct ? `Registrar reposição: ${selectedProduct.name}` : "Registrar reposição";
  }, [selectedProduct]);

  function openModal(product: ReplenishmentProduct) {
    setSelectedProduct(product);
    setQuantity(String(product.suggestedQuantity ?? product.suggestedPurchaseQuantity ?? 1));
    setReason(DEFAULT_REASON);
    setFormError(null);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
  }

  function changeStatus(value: StatusFilter) {
    setPage(0);
    setStatus(value);
  }

  function changeSize(value: number) {
    setPage(0);
    setSize(value);
  }

  function closeModal() {
    if (registerEntry.isPending) {
      return;
    }
    resetModalState();
  }

  function resetModalState() {
    setSelectedProduct(null);
    setQuantity("");
    setReason(DEFAULT_REASON);
    setFormError(null);
  }

  function submit() {
    const numericQuantity = Number(quantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setFormError("Informe uma quantidade maior que zero.");
      appToast.warning("Informe uma quantidade maior que zero.");
      return;
    }
    setFormError(null);
    registerEntry.mutate();
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
        subtitle="Produtos abaixo do estoque mínimo e sugestões simples de reposição."
        title="Reposição de estoque"
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Produtos para reposição</CardTitle>
        </CardHeader>
        <div className="px-5">
          <DataToolbar
            onSubmit={submitSearch}
            search={{
              onChange: setSearch,
              placeholder: "Buscar por produto, SKU, código de barras ou referência...",
              value: search,
            }}
          >
            <select
              className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-44"
              onChange={(event) => changeStatus(event.target.value as StatusFilter)}
              value={status}
            >
              <option value="">Todos</option>
              <option value="OUT_OF_STOCK">Sem estoque</option>
              <option value="LOW_STOCK">Estoque baixo</option>
            </select>
          </DataToolbar>
        </div>
        {replenishments.isLoading ? (
          <LoadingState text="Carregando produtos para reposição..." />
        ) : null}
        {replenishments.isError ? (
          <ErrorState text="Não foi possível carregar os produtos para reposição." />
        ) : null}
        {replenishments.data && replenishments.data.items.length === 0 ? (
          <EmptyState
            description="Produtos abaixo do estoque mínimo aparecerão aqui para entrada rápida de reposição."
            icon={<ShoppingCart size={20} aria-hidden="true" />}
            title="Nenhum produto precisa de reposição no momento"
          />
        ) : null}
        {replenishments.data && replenishments.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>SKU</TableHeaderCell>
                  <TableHeaderCell>Códigos</TableHeaderCell>
                  <TableHeaderCell>Estoque atual</TableHeaderCell>
                  <TableHeaderCell>Mínimo</TableHeaderCell>
                  <TableHeaderCell>Sugestão</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {replenishments.data.items.map((product) => (
                  <TableRow key={product.productId ?? product.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-muted">{product.category ?? "-"}</p>
                    </TableCell>
                    <TableCell>{product.sku ?? "-"}</TableCell>
                    <TableCell>
                      <div className="grid gap-0.5 text-xs text-muted">
                        <span>Barras: {product.barcode ?? "-"}</span>
                        <span>Ref.: {product.referenceCode ?? "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.stockQuantity} {product.unit}
                    </TableCell>
                    <TableCell>
                      {product.minimumStock} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge tone="warning">
                        {(product.suggestedQuantity ?? product.suggestedPurchaseQuantity)} {product.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge tone={product.status === "OUT_OF_STOCK" ? "danger" : "warning"}>
                        {product.status === "OUT_OF_STOCK" ? "Sem estoque" : "Estoque baixo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        className="px-3"
                        onClick={() => openModal(product)}
                        size="md"
                        type="button"
                      >
                        <ShoppingCart size={16} aria-hidden="true" />
                        Registrar reposição
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
        {replenishments.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={replenishments.data.page}
            size={replenishments.data.size}
            total={replenishments.data.totalElements ?? replenishments.data.total}
            totalPages={replenishments.data.totalPages}
          />
        ) : null}
      </Card>

      <Modal
        description="Confirme a quantidade de entrada para atualizar o estoque e gerar a movimentação."
        isOpen={Boolean(selectedProduct)}
        onClose={closeModal}
        title={modalTitle}
      >
        {selectedProduct ? (
          <div className="grid gap-5">
            <div className="grid gap-3 rounded-lg border border-border bg-slate-900 p-4 text-sm dark:bg-slate-800/[0.03]">
              <div className="flex justify-between gap-4">
                <span className="text-muted">Produto</span>
                <strong className="text-right text-ink">{selectedProduct.name}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Estoque atual</span>
                <strong className="text-ink">{selectedProduct.stockQuantity} {selectedProduct.unit}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Estoque mínimo</span>
                <strong className="text-ink">{selectedProduct.minimumStock} {selectedProduct.unit}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted">Sugestão de reposição</span>
                <strong className="text-ink">
                  {(selectedProduct.suggestedQuantity ?? selectedProduct.suggestedPurchaseQuantity)} {selectedProduct.unit}
                </strong>
              </div>
            </div>

            <TextField
              error={formError ?? undefined}
              id="replenishment-quantity"
              label="Quantidade a repor"
              min="0.001"
              onChange={(event) => setQuantity(event.target.value)}
              step="0.001"
              type="number"
              value={quantity}
            />
            <label className="grid gap-1.5">
              <span className="text-sm font-medium text-ink">Motivo/observação</span>
              <textarea
                className="min-h-24 rounded-md border border-border bg-panel px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 dark:placeholder:text-muted"
                maxLength={500}
                onChange={(event) => setReason(event.target.value)}
                value={reason}
              />
            </label>

            <div className="flex flex-wrap justify-end gap-3">
              <Button disabled={registerEntry.isPending} onClick={closeModal} type="button" variant="secondary">
                Cancelar
              </Button>
              <Button disabled={registerEntry.isPending} onClick={submit} type="button">
                <ShoppingCart size={16} aria-hidden="true" />
                {registerEntry.isPending ? "Registrando..." : "Confirmar reposição"}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppLayout>
  );
}
