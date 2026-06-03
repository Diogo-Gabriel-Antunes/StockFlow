import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { CustomerForm } from "@/features/customers/customer-form";

export default function NewCustomerPage() {
  return (
    <AppLayout maxWidth="narrow">
        <div className="mb-6">
          <Link className="text-sm font-semibold text-primary" href="/customers">
            Voltar para clientes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Novo cliente</h1>
        </div>
        <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
          <CustomerForm />
        </section>
    </AppLayout>
  );
}
