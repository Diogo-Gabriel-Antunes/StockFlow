"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Boxes, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { listProducts } from "@/features/products/product-service";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import {
  createStockAdjustment,
  createStockEntry,
  createStockOutput,
  listStockMovements,
} from "./stock-service";
import { stockActionSchema, type StockActionFormInput } from "./schemas";
import type { StockMovementType } from "./types";

const actionOptions = [
  { value: "IN", label: "Entrada", icon: ArrowUp },
  { value: "OUT", label: "Saída", icon: ArrowDown },
  { value: "ADJUSTMENT", label: "Ajuste", icon: SlidersHorizontal },
] as const;

export function StockPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [movementSearch, setMovementSearch] = useState("");
  const [submittedMovementSearch, setSubmittedMovementSearch] = useState("");
  const [movementType, setMovementType] = useState<StockMovementType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<StockActionFormInput>({
    defaultValues: {
      action: "IN",
      productId: "",
      quantity: "1",
      newQuantity: "0",
      reason: "",
    },
  });

  const selectedProductId = useWatch({ control, name: "productId" });
  const selectedAction = useWatch({ control, name: "action" });

  const products = useQuery({
    queryKey: ["products", "stock-options", token],
    queryFn: () => listProducts(token ?? "", { active: true, size: 100 }),
    enabled: Boolean(token),
  });

  const movements = useQuery({
    queryKey: ["stock", "movements", submittedMovementSearch, selectedProductId, movementType, dateFrom, dateTo, page, size, token],
    queryFn: () =>
      listStockMovements(token ?? "", {
        dateFrom,
        dateTo,
        page,
        productId: selectedProductId || undefined,
        search: submittedMovementSearch,
        size,
        type: movementType,
      }),
    enabled: Boolean(token),
  });

  const submitMovement = useMutation({
    mutationFn: async (input: StockActionFormInput) => {
      if (!token) {
        throw new Error("Missing token");
      }
      if (input.action === "ADJUSTMENT") {
        return createStockAdjustment(token, {
          productId: input.productId,
          newQuantity: Number(input.newQuantity),
          reason: input.reason,
        });
      }
      const payload = {
        productId: input.productId,
        quantity: Number(input.quantity),
        reason: input.reason,
      };
      return input.action === "IN"
        ? createStockEntry(token, payload)
        : createStockOutput(token, payload);
    },
    onSuccess: () => {
      setFormError(null);
      setSuccessMessage("Movimentação registrada com sucesso.");
      appToast.success("Movimentação registrada com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      reset({
        action: selectedAction,
        productId: selectedProductId,
        quantity: "1",
        newQuantity: "0",
        reason: "",
      });
    },
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (movements.isError) {
      appToast.error("Não foi possível carregar o histórico.");
    }
  }, [movements.isError]);

  function submitMovementSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedMovementSearch(movementSearch.trim());
  }

  function changeMovementType(value: StockMovementType | "") {
    setPage(0);
    setMovementType(value);
  }

  function changeDateFrom(value: string) {
    setPage(0);
    setDateFrom(value);
  }

  function changeDateTo(value: string) {
    setPage(0);
    setDateTo(value);
  }

  function changeSize(value: number) {
    setPage(0);
    setSize(value);
  }

  async function onSubmit(input: StockActionFormInput) {
    setFormError(null);
    setSuccessMessage(null);
    const parsed = stockActionSchema.safeParse(input);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0] as keyof StockActionFormInput;
        setError(field, { message: issue.message });
      });
      return;
    }

    try {
      await submitMovement.mutateAsync(parsed.data);
    } catch (error) {
      const fallback =
        parsed.data.action === "OUT"
          ? "Estoque insuficiente para realizar a saída."
          : "Não foi possível registrar a movimentação.";
      const message = getApiErrorMessage(error, fallback);
      setFormError(message);
      if (parsed.data.action === "OUT") {
        appToast.warning(message);
      } else {
        appToast.error(message);
      }
    }
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        eyebrow="Estoque"
        subtitle="Registre entradas, saídas e ajustes com histórico por produto."
        title="Movimentações de estoque"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Nova movimentação</CardTitle>
        </CardHeader>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 px-5 pt-5 lg:grid-cols-3">
            <label className="grid gap-1.5" htmlFor="productId">
              <span className="text-sm font-medium text-ink">Produto</span>
              <select
                className="h-11 rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
                id="productId"
                {...register("productId")}
              >
                <option value="">Selecione</option>
                {products.data?.items.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {errors.productId?.message ? (
                <span className="text-xs font-medium text-red-300">
                  {errors.productId.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5" htmlFor="action">
              <span className="text-sm font-medium text-ink">Tipo</span>
              <select
                className="h-11 rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
                id="action"
                {...register("action")}
              >
                {actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {selectedAction === "ADJUSTMENT" ? (
              <TextField
                error={errors.newQuantity?.message}
                label="Novo estoque"
                step="0.001"
                type="number"
                {...register("newQuantity")}
              />
            ) : (
              <TextField
                error={errors.quantity?.message}
                label="Quantidade"
                step="0.001"
                type="number"
                {...register("quantity")}
              />
            )}
          </div>

          <div className="px-5">
            <TextField label="Motivo" {...register("reason")} />
          </div>

          {formError ? (
            <div className="mx-5 rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {formError}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mx-5 rounded-md border border-emerald-900/60 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
              {successMessage}
            </div>
          ) : null}

          <div className="flex justify-end border-t border-border px-5 py-4">
            <Button
              disabled={isSubmitting || submitMovement.isPending}
              type="submit"
            >
              {submitMovement.isPending ? "Registrando..." : "Registrar movimentação"}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Histórico de movimentações</CardTitle>
        </CardHeader>
        <div className="px-5">
          <DataToolbar
            onSubmit={submitMovementSearch}
            search={{
              onChange: setMovementSearch,
              placeholder: "Buscar por produto, SKU ou motivo...",
              value: movementSearch,
            }}
          >
            <select
              className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-44"
              onChange={(event) => changeMovementType(event.target.value as StockMovementType | "")}
              value={movementType}
            >
              <option value="">Todos os tipos</option>
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="SALE">Venda</option>
              <option value="CANCELLATION">Cancelamento</option>
            </select>
            <input
              aria-label="Data inicial"
              className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-40"
              onChange={(event) => changeDateFrom(event.target.value)}
              type="date"
              value={dateFrom}
            />
            <input
              aria-label="Data final"
              className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-40"
              onChange={(event) => changeDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </DataToolbar>
        </div>
        {movements.isLoading ? (
          <LoadingState text="Carregando histórico..." />
        ) : null}
        {movements.isError ? (
          <ErrorState text="Não foi possível carregar o histórico." />
        ) : null}
        {movements.data && movements.data.items.length === 0 ? (
          <EmptyState
            description="Selecione um produto e registre uma entrada, saída ou ajuste para iniciar o histórico."
            icon={<Boxes size={20} aria-hidden="true" />}
            title="Nenhuma movimentação de estoque registrada."
          />
        ) : null}
        {movements.data && movements.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Data</TableHeaderCell>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Quantidade</TableHeaderCell>
                  <TableHeaderCell>Estoque anterior</TableHeaderCell>
                  <TableHeaderCell>Novo estoque</TableHeaderCell>
                  <TableHeaderCell>Motivo</TableHeaderCell>
                  <TableHeaderCell>Usuário</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {movements.data.items.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{movement.productName}</p>
                      <p className="text-xs text-muted">{movement.productSku ?? "-"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge tone={movementTone(movement.type)}>
                        {movementLabel(movement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.quantity}</TableCell>
                    <TableCell>{movement.previousQuantity}</TableCell>
                    <TableCell>{movement.newQuantity}</TableCell>
                    <TableCell>{movement.reason ?? "-"}</TableCell>
                    <TableCell>{movement.createdByName ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
        {movements.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={movements.data.page}
            size={movements.data.size}
            total={movements.data.totalElements ?? movements.data.total}
            totalPages={movements.data.totalPages}
          />
        ) : null}
      </Card>
    </AppLayout>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function movementLabel(type: StockMovementType) {
  const labels: Record<StockMovementType, string> = {
    IN: "Entrada",
    OUT: "Saída",
    ADJUSTMENT: "Ajuste",
    SALE: "Venda",
    CANCELLATION: "Cancelamento",
  };
  return labels[type];
}

function movementTone(type: StockMovementType) {
  const tones: Record<
    StockMovementType,
    "success" | "danger" | "info" | "warning" | "slate"
  > = {
    IN: "success",
    OUT: "danger",
    ADJUSTMENT: "info",
    SALE: "warning",
    CANCELLATION: "slate",
  };
  return tones[type];
}
