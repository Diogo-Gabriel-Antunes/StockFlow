"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { ServiceItemForm } from "@/features/services/service-item-form";
import { getServiceItem } from "@/features/services/service-item-service";

export default function EditServicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const serviceItem = useQuery({
    queryKey: ["services", params.id, token],
    queryFn: () => getServiceItem(token ?? "", params.id),
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
        <Link className="text-sm font-semibold text-primary" href="/services">
          Voltar para serviços
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-ink">Editar serviço</h1>
      </div>
      <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
        {serviceItem.isLoading ? <p className="text-sm text-muted">Carregando serviço...</p> : null}
        {serviceItem.isError ? (
          <p className="text-sm font-medium text-red-700">Não foi possível carregar o serviço.</p>
        ) : null}
        {serviceItem.data ? <ServiceItemForm serviceItem={serviceItem.data} /> : null}
      </section>
    </AppLayout>
  );
}
