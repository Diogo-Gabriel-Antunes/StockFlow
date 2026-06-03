"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { CustomerForm } from "@/features/customers/customer-form";
import { getCustomer } from "@/features/customers/customer-service";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const customer = useQuery({
    queryKey: ["customers", params.id, token],
    queryFn: () => getCustomer(token ?? "", params.id),
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
          <Link className="text-sm font-semibold text-primary" href="/customers">
            Voltar para clientes
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-ink">Editar cliente</h1>
        </div>
        <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
          {customer.isLoading ? (
            <p className="text-sm text-muted">Carregando cliente...</p>
          ) : null}
          {customer.isError ? (
            <p className="text-sm font-medium text-red-700">
              Não foi possível carregar o cliente.
            </p>
          ) : null}
          {customer.data ? <CustomerForm customer={customer.data} /> : null}
        </section>
    </AppLayout>
  );
}
