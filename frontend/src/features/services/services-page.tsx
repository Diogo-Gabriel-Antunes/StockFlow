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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataToolbar } from "@/components/ui/data-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
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
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { ServiceItemForm } from "./service-item-form";
import { deleteServiceItem, listServiceItems } from "./service-item-service";
import type { ServiceItem } from "./types";

type ModalMode = "create" | "edit";
type ActiveFilter = "all" | "active" | "inactive";

export function ServicesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<ServiceItem | undefined>();
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);

  const services = useQuery({
    queryKey: ["services", submittedSearch, activeFilter, page, size, token],
    queryFn: () =>
      listServiceItems(token ?? "", {
        active: activeFilter === "all" ? undefined : activeFilter === "active",
        page,
        search: submittedSearch,
        size,
      }),
    enabled: Boolean(token),
  });

  const removeService = useMutation({
    mutationFn: (id: string) => deleteServiceItem(token ?? "", id),
    onSuccess: () => {
      appToast.success("Serviço excluído com sucesso.");
      setServiceToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível excluir o serviço."));
    },
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (services.isError) {
      appToast.error("Não foi possível carregar os serviços.");
    }
  }, [services.isError]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
  }

  function changeActiveFilter(value: ActiveFilter) {
    setPage(0);
    setActiveFilter(value);
  }

  function changeSize(value: number) {
    setPage(0);
    setSize(value);
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

  function confirmDelete() {
    if (serviceToDelete) {
      removeService.mutate(serviceToDelete.id);
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
          placeholder: "Buscar por nome ou descrição...",
          value: search,
        }}
      >
        <select
          className="h-11 w-full rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-44"
          onChange={(event) => changeActiveFilter(event.target.value as ActiveFilter)}
          value={activeFilter}
        >
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos</option>
        </select>
      </DataToolbar>

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
                          onClick={() => setServiceToDelete(service)}
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
        {services.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={services.data.page}
            size={services.data.size}
            total={services.data.totalElements ?? services.data.total}
            totalPages={services.data.totalPages}
          />
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
      <ConfirmDialog
        confirmLabel="Excluir"
        description="Tem certeza que deseja excluir este serviço? Esta ação não poderá ser desfeita."
        loading={removeService.isPending}
        loadingLabel="Excluindo..."
        onCancel={() => setServiceToDelete(null)}
        onConfirm={confirmDelete}
        open={Boolean(serviceToDelete)}
        title="Excluir serviço"
        variant="danger"
      />
    </AppLayout>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
