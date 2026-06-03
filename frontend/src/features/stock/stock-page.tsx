"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { AppLayout } from "@/components/layout/app-layout";
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
    <AppLayout>
      <header className="mb-6">
        <p className="text-sm font-medium text-primary">Estoque</p>
        <h1 className="text-2xl font-semibold text-ink">Movimentações de estoque</h1>
        <p className="mt-1 text-sm text-muted">
          Registre entradas, saídas e ajustes com histórico por produto.
        </p>
      </header>

      <section className="mb-6 rounded-lg border border-border bg-panel p-5 shadow-subtle">
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-1.5" htmlFor="productId">
              <span className="text-sm font-medium text-ink">Produto</span>
              <select
                className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
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
                className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
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

          <TextField label="Motivo" {...register("reason")} />

          {formError ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
              {formError}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting || submitMovement.isPending}
              type="submit"
            >
              {submitMovement.isPending ? "Registrando..." : "Registrar movimentação"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
        {movements.isLoading ? (
          <p className="p-5 text-sm text-muted">Carregando histórico...</p>
        ) : null}
        {movements.isError ? (
          <p className="p-5 text-sm font-medium text-red-700">
            Não foi possível carregar o histórico.
          </p>
        ) : null}
        {movements.data && movements.data.items.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhuma movimentação encontrada.</p>
        ) : null}
        {movements.data && movements.data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Anterior</th>
                  <th className="px-4 py-3 font-semibold">Novo</th>
                  <th className="px-4 py-3 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movements.data.items.map((movement) => (
                  <tr className="border-t border-border" key={movement.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{movement.productName}</p>
                      <p className="text-xs text-muted">{movement.productSku ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{movementLabel(movement.type)}</td>
                    <td className="px-4 py-3 text-muted">{movement.previousQuantity}</td>
                    <td className="px-4 py-3 text-muted">{movement.newQuantity}</td>
                    <td className="px-4 py-3 text-muted">{movement.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
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
