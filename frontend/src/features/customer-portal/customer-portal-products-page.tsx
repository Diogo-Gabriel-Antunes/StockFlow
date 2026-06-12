"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, Search } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { listPortalProducts } from "./customer-portal-service";
import { PublicShell } from "./customer-portal-page";
import type { PortalProduct } from "./types";

export function CustomerPortalProductsPage({ token }: { token: string }) {
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(0);
  const size = 12;
  const products = useQuery({
    queryKey: ["customer-portal-products", token, submittedSearch, page, size],
    queryFn: () => listPortalProducts(token, { page, search: submittedSearch, size }),
    enabled: Boolean(token),
    retry: false,
  });

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
  }

  return (
    <PublicShell>
      <header className="flex flex-col gap-3 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Catálogo</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Produtos disponíveis</h1>
        </div>
        <ButtonLink href={`/customer-portal/${token}`} variant="secondary">
          Voltar ao portal
        </ButtonLink>
      </header>

      <form className="flex flex-col gap-3 rounded-lg border border-border bg-panel p-4 sm:flex-row" onSubmit={submitSearch}>
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} aria-hidden="true" />
          <input
            className="h-11 w-full rounded-md border border-border bg-slate-950/40 pl-9 pr-3 text-sm text-ink outline-none focus:border-primary"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar produto por nome, SKU ou referência"
            value={search}
          />
        </label>
        <button className="h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-cyan-800" type="submit">
          Buscar
        </button>
      </form>

      {products.isLoading ? <p className="text-sm text-muted">Carregando produtos...</p> : null}
      {products.isError ? (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 p-6 text-red-300">
          Não foi possível carregar o catálogo.
        </div>
      ) : null}
      {products.data && products.data.items.length === 0 ? (
        <div className="rounded-lg border border-border bg-panel p-6 text-sm text-muted">
          Nenhum produto disponível.
        </div>
      ) : null}
      {products.data && products.data.items.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.data.items.map((product) => (
            <ProductCard key={product.id} product={product} token={token} />
          ))}
        </section>
      ) : null}
      {products.data ? (
        <div className="rounded-lg border border-border bg-panel">
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={() => undefined}
            page={products.data.page}
            size={products.data.size}
            total={products.data.totalElements}
            totalPages={products.data.totalPages}
          />
        </div>
      ) : null}
    </PublicShell>
  );
}

function ProductCard({ product, token }: { product: PortalProduct; token: string }) {
  return (
    <article className="grid overflow-hidden rounded-lg border border-border bg-panel">
      <ProductImage imageUrl={product.imageUrl} name={product.name} />
      <div className="grid gap-3 p-4">
        <div>
          <h2 className="font-semibold text-ink">{product.name}</h2>
          {product.description ? <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p> : null}
          <p className="mt-2 text-xs text-muted">{productMeta(product)}</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-cyan-800"
          href={`/customer-portal/${token}/quote-requests/new?productId=${product.id}`}
        >
          <Boxes size={16} aria-hidden="true" />
          Solicitar orçamento
        </Link>
      </div>
    </article>
  );
}

export function ProductImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-slate-950/50 text-muted">
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={name} className="h-full w-full object-cover" onError={() => setFailed(true)} src={imageUrl} />
      ) : (
        <Boxes size={28} aria-hidden="true" />
      )}
    </div>
  );
}

function productMeta(product: PortalProduct) {
  const meta = [product.sku ? `SKU ${product.sku}` : null, product.referenceCode ? `Ref. ${product.referenceCode}` : null]
    .filter(Boolean);
  return meta.length > 0 ? meta.join(" · ") : "Produto cadastrado";
}
