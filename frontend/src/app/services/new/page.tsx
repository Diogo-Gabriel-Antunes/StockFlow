import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { ServiceItemForm } from "@/features/services/service-item-form";

export default function NewServicePage() {
  return (
    <AppLayout maxWidth="narrow">
      <div className="mb-6">
        <Link className="text-sm font-semibold text-primary" href="/services">
          Voltar para serviços
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Novo serviço</h1>
      </div>
      <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
        <ServiceItemForm />
      </section>
    </AppLayout>
  );
}
