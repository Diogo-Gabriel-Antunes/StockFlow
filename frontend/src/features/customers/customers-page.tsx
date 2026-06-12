"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
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
import { deleteCustomer, listCustomers } from "./customer-service";
import { CustomerForm } from "./customer-form";
import type { Customer } from "./types";

type ModalMode = "create" | "edit";

export function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<Customer | undefined>();
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const customers = useQuery({
    queryKey: ["customers", submittedSearch, page, size, token],
    queryFn: () => listCustomers(token ?? "", { page, search: submittedSearch, size }),
    enabled: Boolean(token),
  });

  const removeCustomer = useMutation({
    mutationFn: (id: string) => deleteCustomer(token ?? "", id),
    onSuccess: () => {
      appToast.success("Cliente excluído com sucesso.");
      setCustomerToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível excluir o cliente."));
    },
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (customers.isError) {
      appToast.error("Não foi possível carregar os clientes.");
    }
  }, [customers.isError]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
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

  function openEditModal(customer: Customer) {
    setMode("edit");
    setSelectedItem(customer);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setSelectedItem(undefined);
    setMode("create");
  }

  function handleSaved() {
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["customers"] });
  }

  function confirmDelete() {
    if (customerToDelete) {
      removeCustomer.mutate(customerToDelete.id);
    }
  }

  async function copyPortalLink(customer: Customer) {
    if (!customer.portalToken || typeof window === "undefined") {
      appToast.error("Link do portal indisponível.");
      return;
    }
    const url = `${window.location.origin}/customer-portal/${customer.portalToken}`;
    try {
      await navigator.clipboard.writeText(url);
      appToast.success("Link do portal copiado.");
    } catch {
      appToast.error("Não foi possível copiar o link do portal.");
    }
  }

  return (
    <AppLayout maxWidth="wide">
        <PageHeader
          action={
            <Button
            onClick={openCreateModal}
            type="button"
          >
            <Plus size={17} aria-hidden="true" />
            Novo cliente
            </Button>
          }
          eyebrow="Clientes"
          subtitle="Consulte e mantenha os contatos usados nos orçamentos."
          title="Cadastro de clientes"
        />

        <DataToolbar
          onSubmit={submitSearch}
          search={{
            onChange: setSearch,
            placeholder: "Buscar por nome, documento, e-mail ou telefone",
            value: search,
          }}
        />

        <Card className="overflow-hidden">
          {customers.isLoading ? (
            <LoadingState text="Carregando clientes..." />
          ) : null}

          {customers.isError ? (
            <ErrorState text="Não foi possível carregar os clientes." />
          ) : null}

          {customers.data && customers.data.items.length === 0 ? (
            <EmptyState
              action={
                <Button onClick={openCreateModal} type="button">
                  <Plus size={17} aria-hidden="true" />
                  Novo cliente
                </Button>
              }
              description="Comece adicionando seu primeiro cliente para criar orçamentos com mais rapidez."
              icon={<Users size={20} aria-hidden="true" />}
              title="Nenhum cliente cadastrado"
            />
          ) : null}

          {customers.data && customers.data.items.length > 0 ? (
            <TableShell>
              <DataTable>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Nome</TableHeaderCell>
                    <TableHeaderCell>Contato</TableHeaderCell>
                    <TableHeaderCell>Cidade</TableHeaderCell>
                    <TableHeaderCell align="right">Ações</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {customers.data.items.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell primary>
                        <p className="font-semibold text-ink">{customer.name}</p>
                        <div className="mt-1">
                          <Badge tone="neutral">
                            {customer.type === "PERSON" ? "Pessoa física" : "Empresa"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.email ?? customer.whatsapp ?? customer.phone ?? "-"}
                      </TableCell>
                      <TableCell>
                        {[customer.city, customer.state].filter(Boolean).join(" / ") || "-"}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            aria-label={`Copiar link do portal de ${customer.name}`}
                            disabled={!customer.portalToken}
                            onClick={() => copyPortalLink(customer)}
                            type="button"
                          >
                            <Copy size={16} aria-hidden="true" />
                          </ActionButton>
                          <ActionButton
                            aria-label={`Editar ${customer.name}`}
                            onClick={() => openEditModal(customer)}
                            type="button"
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </ActionButton>
                          <ActionButton
                            aria-label={`Excluir ${customer.name}`}
                            disabled={removeCustomer.isPending}
                            onClick={() => setCustomerToDelete(customer)}
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
        {customers.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={customers.data.page}
            size={customers.data.size}
            total={customers.data.totalElements ?? customers.data.total}
            totalPages={customers.data.totalPages}
          />
        ) : null}
        </Card>
        <Modal
          description="Preencha os dados do cliente sem sair da listagem."
          isOpen={isOpen}
          onClose={closeModal}
          title={mode === "create" ? "Novo cliente" : "Editar cliente"}
        >
          <CustomerForm
            customer={selectedItem}
            key={selectedItem?.id ?? "new-customer"}
            onCancel={closeModal}
            onSaved={handleSaved}
          />
        </Modal>
        <ConfirmDialog
          confirmLabel="Excluir"
          description="Tem certeza que deseja excluir este cliente? Esta ação não poderá ser desfeita."
          loading={removeCustomer.isPending}
          loadingLabel="Excluindo..."
          onCancel={() => setCustomerToDelete(null)}
          onConfirm={confirmDelete}
          open={Boolean(customerToDelete)}
          title="Excluir cliente"
          variant="danger"
        />
    </AppLayout>
  );
}
