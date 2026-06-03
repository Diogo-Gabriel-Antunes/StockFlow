"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { deleteCustomer, listCustomers } from "./customer-service";

export function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const customers = useQuery({
    queryKey: ["customers", submittedSearch, token],
    queryFn: () => listCustomers(token ?? "", { search: submittedSearch }),
    enabled: Boolean(token),
  });

  const removeCustomer = useMutation({
    mutationFn: (id: string) => deleteCustomer(token ?? "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  }

  return (
    <AppLayout>
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Clientes</p>
            <h1 className="text-2xl font-semibold text-ink">Cadastro de clientes</h1>
            <p className="mt-1 text-sm text-muted">
              Consulte e mantenha os contatos usados nos orçamentos.
            </p>
          </div>
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800"
            href="/customers/new"
          >
            <Plus size={17} aria-hidden="true" />
            Novo cliente
          </Link>
        </header>

        <form className="mb-4 flex gap-2" onSubmit={submitSearch}>
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-teal-100"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, documento, e-mail ou telefone"
              value={search}
            />
          </div>
          <button
            className="h-11 rounded-md border border-border bg-panel px-4 text-sm font-semibold text-ink shadow-subtle transition hover:bg-slate-50"
            type="submit"
          >
            Buscar
          </button>
        </form>

        <section className="overflow-hidden rounded-lg border border-border bg-panel shadow-subtle">
          {customers.isLoading ? (
            <p className="p-5 text-sm text-muted">Carregando clientes...</p>
          ) : null}

          {customers.isError ? (
            <p className="p-5 text-sm font-medium text-red-700">
              Não foi possível carregar os clientes.
            </p>
          ) : null}

          {customers.data && customers.data.items.length === 0 ? (
            <p className="p-5 text-sm text-muted">Nenhum cliente encontrado.</p>
          ) : null}

          {customers.data && customers.data.items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Nome</th>
                    <th className="px-4 py-3 font-semibold">Contato</th>
                    <th className="px-4 py-3 font-semibold">Cidade</th>
                    <th className="px-4 py-3 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.data.items.map((customer) => (
                    <tr className="border-t border-border" key={customer.id}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-ink">{customer.name}</p>
                        <p className="text-xs text-muted">
                          {customer.type === "PERSON" ? "Pessoa física" : "Empresa"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {customer.email ?? customer.whatsapp ?? customer.phone ?? "-"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {[customer.city, customer.state].filter(Boolean).join(" / ") || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            aria-label={`Editar ${customer.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-ink transition hover:bg-slate-50"
                            href={`/customers/${customer.id}`}
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </Link>
                          <button
                            aria-label={`Excluir ${customer.name}`}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-red-700 transition hover:bg-red-50"
                            disabled={removeCustomer.isPending}
                            onClick={() => removeCustomer.mutate(customer.id)}
                            type="button"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
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
