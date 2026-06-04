"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Modal } from "@/components/ui/Modal";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
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
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<Customer | undefined>();

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

  function confirmDelete(customer: Customer) {
    if (
      window.confirm(
        "Tem certeza que deseja continuar? Esta ação pode afetar dados relacionados.",
      )
    ) {
      removeCustomer.mutate(customer.id);
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
                            aria-label={`Editar ${customer.name}`}
                            onClick={() => openEditModal(customer)}
                            type="button"
                          >
                            <Pencil size={16} aria-hidden="true" />
                          </ActionButton>
                          <ActionButton
                            aria-label={`Excluir ${customer.name}`}
                            disabled={removeCustomer.isPending}
                            onClick={() => confirmDelete(customer)}
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
    </AppLayout>
  );
}
