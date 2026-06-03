"use client";

import { useQuery } from "@tanstack/react-query";
import { Boxes, FileText, LogOut, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { getMe } from "@/features/auth/auth-service";
import { clearToken, getToken } from "@/features/auth/auth-storage";

const cards = [
  { label: "Clientes", value: "0", icon: Users },
  { label: "Produtos", value: "0", icon: Boxes },
  { label: "Orçamentos", value: "0", icon: FileText },
];

export default function DashboardPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => getMe(token ?? ""),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token) {
      console.log("[auth] redirect to login: missing token");
      clearToken();
      router.replace("/login");
      return;
    }

    if (isError) {
      console.log("[auth] redirect to login: GET /auth/me failed");
      clearToken();
      router.replace("/login");
    }
  }, [isError, router, token]);

  function logout() {
    clearToken();
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppLayout>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">StockFlow</p>
            <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
            <p className="mt-1 text-sm text-muted">
              {isLoading ? "Carregando..." : data?.company.name}
            </p>
          </div>
          <button
            className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
            onClick={logout}
            type="button"
          >
            <LogOut size={17} aria-hidden="true" />
            Sair
          </button>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <article
              className="rounded-lg border border-border bg-panel p-5 shadow-subtle"
              key={card.label}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">
                    {card.value}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-primary">
                  <card.icon size={21} aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </section>

        {data ? (
          <section className="mt-6 rounded-lg border border-border bg-panel p-5 shadow-subtle">
            <p className="text-sm text-muted">Usuário autenticado</p>
            <h2 className="mt-1 text-lg font-semibold text-ink">{data.user.name}</h2>
            <p className="mt-1 text-sm text-muted">
              {data.user.email} · {data.user.role}
            </p>
          </section>
        ) : null}
    </AppLayout>
  );
}
