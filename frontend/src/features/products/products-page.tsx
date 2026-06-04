"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Pencil, Plus, Trash2 } from "lucide-react";
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
import { deleteProduct, listProducts } from "./product-service";
import { ProductForm } from "./product-form";
import type { Product } from "./types";

type ModalMode = "create" | "edit";

export function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<Product | undefined>();

  const products = useQuery({
    queryKey: ["products", submittedSearch, token],
    queryFn: () => listProducts(token ?? "", { search: submittedSearch }),
    enabled: Boolean(token),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => deleteProduct(token ?? "", id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
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

  function openEditModal(product: Product) {
    setMode("edit");
    setSelectedItem(product);
    setIsOpen(true);
  }

  function closeModal() {
    setIsOpen(false);
    setSelectedItem(undefined);
    setMode("create");
  }

  function handleSaved() {
    closeModal();
    queryClient.invalidateQueries({ queryKey: ["products"] });
  }

  function confirmDelete(product: Product) {
    if (
      window.confirm(
        "Tem certeza que deseja continuar? Esta ação pode afetar dados relacionados.",
      )
    ) {
      removeProduct.mutate(product.id);
    }
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        action={
          <Button onClick={openCreateModal} type="button">
            <Plus size={17} aria-hidden="true" />
            Novo produto
          </Button>
        }
        eyebrow="Produtos"
        subtitle="Organize itens físicos, preços e estoque mínimo."
        title="Cadastro de produtos"
      />

      <DataToolbar
        onSubmit={submitSearch}
        search={{
          onChange: setSearch,
          placeholder: "Buscar por nome, SKU ou categoria",
          value: search,
        }}
      />

      <Card className="overflow-hidden">
        {products.isLoading ? <LoadingState text="Carregando produtos..." /> : null}
        {products.isError ? (
          <ErrorState text="Não foi possível carregar os produtos." />
        ) : null}
        {products.data && products.data.items.length === 0 ? (
          <EmptyState
            action={
              <Button onClick={openCreateModal} type="button">
                <Plus size={17} aria-hidden="true" />
                Novo produto
              </Button>
            }
            description="Cadastre produtos para montar orçamentos e acompanhar estoque mínimo."
            icon={<Boxes size={20} aria-hidden="true" />}
            title="Nenhum produto cadastrado"
          />
        ) : null}
        {products.data && products.data.items.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>Preço</TableHeaderCell>
                  <TableHeaderCell>Estoque</TableHeaderCell>
                  <TableHeaderCell align="right">Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {products.data.items.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-muted">{product.sku ?? product.category ?? "-"}</p>
                    </TableCell>
                    <TableCell>{formatMoney(product.salePrice)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          {product.stockQuantity} {product.unit} · mín. {product.minimumStock}
                        </span>
                        {product.stockQuantity <= product.minimumStock ? (
                          <Badge tone="warning">Baixo</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex justify-end gap-2">
                        <ActionButton
                          aria-label={`Editar ${product.name}`}
                          onClick={() => openEditModal(product)}
                          type="button"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </ActionButton>
                        <ActionButton
                          aria-label={`Excluir ${product.name}`}
                          disabled={removeProduct.isPending}
                          onClick={() => confirmDelete(product)}
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
        description="Atualize preços, estoque inicial e dados do produto sem sair da listagem."
        isOpen={isOpen}
        onClose={closeModal}
        title={mode === "create" ? "Novo produto" : "Editar produto"}
      >
        <ProductForm
          key={selectedItem?.id ?? "new-product"}
          onCancel={closeModal}
          onSaved={handleSaved}
          product={selectedItem}
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
