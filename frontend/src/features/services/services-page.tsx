"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import {
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
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

  function confirmDelete(serviceItem: ServiceItem) {
    if (
      window.confirm(
        "Tem certeza que deseja continuar? Esta ação pode afetar dados relacionados.",
      )
    ) {
      removeService.mutate(serviceItem.id);
    }
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        action={
          <Button onClick={openCreateModal} type="button">
            <Plus size={17} aria-hidden="true" />
            Novo serviço
          </Button>
        }
        eyebrow="Serviços"
        subtitle="Cadastre itens sem estoque para usar nos orçamentos."
        title="Cadastro de serviços"
      />

      <DataToolbar
        onSubmit={submitSearch}
        search={{
          onChange: setSearch,
          placeholder: "Buscar por nome ou descrição",
          value: search,
        }}
      />

      <Card className="overflow-hidden">
        {services.isLoading ? <LoadingState text="Carregando serviços..." /> : null}
        {services.isError ? (
          <ErrorState text="Não foi possível carregar os serviços." />
        ) : null}
        {services.data && services.data.items.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={openCreateModal} type="button">
                <Plus size={17} aria-hidden="true" />
                Novo serviço
              </Button>
            }
            description="Cadastre serviços para compor orçamentos junto com produtos."
            icon={<Wrench size={20} aria-hidden="true" />}
            title="Nenhum serviço cadastrado"
          />
        ) : null}
        {services.data && services.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Serviço</TableHeaderCell>
                  <TableHeaderCell>Preço</TableHeaderCell>
                  <TableHeaderCell>Custo estimado</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {services.data.items.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{service.name}</p>
                      <p className="text-xs text-muted">{service.description ?? "-"}</p>
                    </TableCell>
                    <TableCell>{formatMoney(service.defaultPrice)}</TableCell>
                    <TableCell>{formatMoney(service.estimatedCost)}</TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          aria-label={`Editar ${service.name}`}
                          onClick={() => openEditModal(service)}
                          type="button"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </ActionButton>
                        <ActionButton
                          aria-label={`Excluir ${service.name}`}
                          disabled={removeService.isPending}
                          onClick={() => confirmDelete(service)}
                          type="button"
                          variant="danger"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
      </Card>
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
