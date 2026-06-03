import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { ProductForm } from "@/features/products/product-form";

export default function NewProductPage() {
  return (
    <AppLayout maxWidth="narrow">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-primary" href="/products">
          Voltar para produtos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Novo produto</h1>
      </div>
      <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
        <ProductForm />
      </section>
    </AppLayout>
  );
}
