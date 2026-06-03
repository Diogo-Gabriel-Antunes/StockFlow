import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { QuoteForm } from "@/features/quotes/quote-form";

export default function NewQuotePage() {
  return (
    <AppLayout>
      <div className="mb-6">
        <Link className="text-sm font-semibold text-primary" href="/quotes">
          Voltar para orçamentos
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Novo orçamento</h1>
      </div>
      <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
        <QuoteForm />
      </section>
    </AppLayout>
  );
}
