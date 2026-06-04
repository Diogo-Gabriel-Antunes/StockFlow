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
import { TextField } from "@/components/ui/text-field";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { listProducts } from "@/features/products/product-service";
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
    queryFn: () => listProducts(token ?? "", { size: 100 }),
    enabled: Boolean(token),
  });

  const movements = useQuery({
    queryKey: ["stock", "movements", selectedProductId, token],
    queryFn: () =>
      listStockMovements(token ?? "", {
        productId: selectedProductId || undefined,
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
      queryClient.invalidateQueries({ queryKey: ["stock"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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

  async function onSubmit(input: StockActionFormInput) {
    setFormError(null);
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
    } catch {
      setFormError("Não foi possível registrar a movimentação.");
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
                className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
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
                <span className="text-xs font-medium text-red-700">
                  {errors.productId.message}
                </span>
              ) : null}
            </label>

            <label className="grid gap-1.5" htmlFor="action">
              <span className="text-sm font-medium text-ink">Tipo</span>
              <select
                className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
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
            <div className="mx-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
              {formError}
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
            title="Nenhuma movimentação encontrada"
          />
        ) : null}
        {movements.data && movements.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>Tipo</TableHeaderCell>
                  <TableHeaderCell>Anterior</TableHeaderCell>
                  <TableHeaderCell>Novo</TableHeaderCell>
                  <TableHeaderCell>Motivo</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {movements.data.items.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{movement.productName}</p>
                      <p className="text-xs text-muted">{movement.productSku ?? "-"}</p>
                    </TableCell>
                    <TableCell>
                      <Badge tone={movementTone(movement.type)}>
                        {movementLabel(movement.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>{movement.previousQuantity}</TableCell>
                    <TableCell>{movement.newQuantity}</TableCell>
                    <TableCell>{movement.reason ?? "-"}</TableCell>
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
