"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { listLowStockProducts } from "./stock-service";

export function LowStockPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const lowStock = useQuery({
    queryKey: ["stock", "low", token],
    queryFn: () => listLowStockProducts(token ?? ""),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Reposição</p>
          <h1 className="text-2xl font-semibold text-ink">Produtos abaixo do mínimo</h1>
          <p className="mt-1 text-sm text-muted">
            Acompanhe produtos que precisam de compra ou reposição.
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
          href="/stock"
        >
          Registrar entrada
        </Link>
      </header>

      <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
        {lowStock.isLoading ? (
          <p className="p-5 text-sm text-muted">Carregando produtos...</p>
        ) : null}
        {lowStock.isError ? (
          <p className="p-5 text-sm font-medium text-red-700">
            Não foi possível carregar produtos abaixo do mínimo.
          </p>
        ) : null}
        {lowStock.data && lowStock.data.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhum produto abaixo do mínimo.</p>
        ) : null}
        {lowStock.data && lowStock.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Produto</th>
                  <th className="px-4 py-3 font-semibold">Estoque atual</th>
                  <th className="px-4 py-3 font-semibold">Mínimo</th>
                  <th className="px-4 py-3 font-semibold">Compra sugerida</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.data.map((product) => (
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
