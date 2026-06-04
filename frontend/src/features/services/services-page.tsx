"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Modal } from "@/components/ui/Modal";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { ServiceItemForm } from "./service-item-form";
import { deleteServiceItem, listServiceItems } from "./service-item-service";
import type { ServiceItem } from "./types";

type ModalMode = "create" | "edit";

export function ServicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<ServiceItem | undefined>();

  const services = useQuery({
    queryKey: ["services", submittedSearch, token],
    queryFn: () => listServiceItems(token ?? "", { search: submittedSearch }),
    enabled: Boolean(token),
  });

  const removeService = useMutation({
    mutationFn: (id: string) => deleteServiceItem(token ?? "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
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

  function openCreateModal() {
    setMode("create");
    setSelectedItem(undefined);
    setIsOpen(true);
  }

  function openEditModal(serviceItem: ServiceItem) {
    setMode("edit");
    setSelectedItem(serviceItem);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setSelectedItem(undefined);
    setMode("create");
  }

  function handleSaved() {
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["services"] });
  }

  return (
    <AppLayout>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Serviços</p>
          <h1 className="text-2xl font-semibold text-ink">Cadastro de serviços</h1>
          <p className="mt-1 text-sm text-muted">
            Cadastre itens sem estoque para usar nos orçamentos.
          </p>
        </div>
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800"
          onClick={openCreateModal}
          type="button"
        >
          <Plus size={17} aria-hidden="true" />
          Novo serviço
        </button>
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
            placeholder="Buscar por nome ou descrição"
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
        {services.isLoading ? <p className="p-5 text-sm text-muted">Carregando serviços...</p> : null}
        {services.isError ? (
          <p className="p-5 text-sm font-medium text-red-700">Não foi possível carregar os serviços.</p>
        ) : null}
        {services.data && services.data.items.length === 0 ? (
          <p className="p-5 text-sm text-muted">Nenhum serviço encontrado.</p>
        ) : null}
        {services.data && services.data.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-3 font-semibold">Serviço</th>
                  <th className="px-4 py-3 font-semibold">Preço</th>
                  <th className="px-4 py-3 font-semibold">Custo estimado</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {services.data.items.map((service) => (
                  <tr className="border-t border-border" key={service.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{service.name}</p>
                      <p className="text-xs text-muted">{service.description ?? "-"}</p>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatMoney(service.defaultPrice)}</td>
                    <td className="px-4 py-3 text-muted">{formatMoney(service.estimatedCost)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          aria-label={`Editar ${service.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-ink transition hover:bg-slate-50"
                          onClick={() => openEditModal(service)}
                          type="button"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          aria-label={`Excluir ${service.name}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-red-700 transition hover:bg-red-50"
                          disabled={removeService.isPending}
                          onClick={() => removeService.mutate(service.id)}
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
      <Modal
        description="Cadastre ou ajuste serviços usados nos orçamentos."
        isOpen={isOpen}
        onClose={closeModal}
        title={mode === "create" ? "Novo serviço" : "Editar serviço"}
      >
        <ServiceItemForm
          key={selectedItem?.id ?? "new-service"}
          onCancel={closeModal}
          onSaved={handleSaved}
          serviceItem={selectedItem}
        />
      </Modal>
    </AppLayout>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
