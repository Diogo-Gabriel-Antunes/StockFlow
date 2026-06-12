"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { ProductForm } from "@/features/products/product-form";
import { getProduct } from "@/features/products/product-service";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const product = useQuery({
    queryKey: ["products", params.id, token],
    queryFn: () => getProduct(token ?? "", params.id),
    enabled: Boolean(token && params.id),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <AppLayout maxWidth="narrow">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-primary" href="/products">
          Voltar para produtos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Editar produto</h1>
      </div>
      <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
        {product.isLoading ? <p className="text-sm text-muted">Carregando produto...</p> : null}
        {product.isError ? (
          <p className="text-sm font-medium text-red-300">Não foi possível carregar o produto.</p>
        ) : null}
        {product.data ? <ProductForm product={product.data} /> : null}
      </section>
    </AppLayout>
  );
}
