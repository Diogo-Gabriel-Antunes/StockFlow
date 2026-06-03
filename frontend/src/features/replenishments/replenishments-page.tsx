"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, ShoppingCart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
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
    <AppLayout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Reposição / Compras</p>
          <h1 className="text-2xl font-semibold text-ink">Produtos críticos</h1>
          <p className="mt-1 text-sm text-muted">
            Veja produtos no mínimo ou abaixo dele e registre entradas rápidas.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
          onClick={() => replenishments.refetch()}
          type="button"
        >
          <RefreshCw size={16} aria-hidden="true" />
          Atualizar
        </button>
      </header>

      {formError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
          {formError}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
        {replenishments.isLoading ? (
          <p className="p-5 text-sm text-muted">Carregando produtos críticos...</p>
        ) : null}
        {replenishments.isError ? (
          <p className="p-5 text-sm font-medium text-red-700">
            Não foi possível carregar a reposição.
          </p>
        ) : null}
        {replenishments.data && replenishments.data.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhum produto crítico no momento.</p>
        ) : null}
        {replenishments.data && replenishments.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Estoque</th>
                  <th className="px-4 py-3 font-semibold">Mínimo</th>
                  <th className="px-4 py-3 font-semibold">Compra sugerida</th>
                  <th className="px-4 py-3 font-semibold">Entrada</th>
                </tr>
              </thead>
              <tbody>
                {replenishments.data.map((product) => (
                  <tr className="border-t border-border" key={product.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-muted">{product.sku ?? product.category ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.stockQuantity} {product.unit}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.minimumStock} {product.unit}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {product.suggestedPurchaseQuantity} {product.unit}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex min-w-56 items-center gap-2">
                        <label className="sr-only" htmlFor={`quantity-${product.id}`}>
                          Quantidade para {product.name}
                        </label>
                        <input
                          className="h-10 w-24 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
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
                        <button
                          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800 disabled:opacity-60"
                          disabled={registerEntry.isPending}
                          onClick={() => submit(product.id, product.suggestedPurchaseQuantity)}
                          type="button"
                        >
                          <ShoppingCart size={16} aria-hidden="true" />
                          Registrar
                        </button>
                      </div>
                    </td>
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
