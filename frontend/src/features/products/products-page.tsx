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
import { deleteProduct, listProducts } from "./product-service";
import { ProductForm } from "./product-form";
import type { Product } from "./types";
import { ProductImage } from "@/features/customer-portal/customer-portal-products-page";

type ModalMode = "create" | "edit";
type ActiveFilter = "all" | "active" | "inactive";

export function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [lowStock, setLowStock] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("create");
  const [selectedItem, setSelectedItem] = useState<Product | undefined>();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const products = useQuery({
    queryKey: ["products", submittedSearch, activeFilter, lowStock, page, size, token],
    queryFn: () =>
      listProducts(token ?? "", {
        active: activeFilter === "all" ? undefined : activeFilter === "active",
        lowStock: lowStock || undefined,
        page,
        search: submittedSearch,
        size,
      }),
    enabled: Boolean(token),
  });

  const removeProduct = useMutation({
    mutationFn: (id: string) => deleteProduct(token ?? "", id),
    onSuccess: () => {
      appToast.success("Produto inativado com sucesso.");
      setProductToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => {
      appToast.error(getApiErrorMessage(error, "Não foi possível inativar o produto."));
    },
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  useEffect(() => {
    if (products.isError) {
      appToast.error("Não foi possível carregar os produtos.");
    }
  }, [products.isError]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(search.trim());
  }

  function changeActiveFilter(value: ActiveFilter) {
    setPage(0);
    setActiveFilter(value);
  }

  function changeLowStock(value: boolean) {
    setPage(0);
    setLowStock(value);
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

  function confirmDelete() {
    if (productToDelete) {
      removeProduct.mutate(productToDelete.id);
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
          placeholder: "Buscar por nome, SKU, código de barras ou referência...",
          value: search,
        }}
      >
        <select
          className="h-11 w-full rounded-md border border-border bg-panel px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 sm:w-44"
          onChange={(event) => changeActiveFilter(event.target.value as ActiveFilter)}
          value={activeFilter}
        >
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="all">Todos</option>
        </select>
        <label className="flex h-11 items-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-medium text-ink dark:bg-slate-950/40">
          <input
            checked={lowStock}
            className="h-4 w-4 accent-primary"
            onChange={(event) => changeLowStock(event.target.checked)}
            type="checkbox"
          />
          Estoque baixo
        </label>
      </DataToolbar>

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
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border">
                          <ProductImage imageUrl={product.imageUrl} name={product.name} />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-ink">{product.name}</p>
                            <Badge tone={product.active ? "success" : "neutral"}>
                              {product.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted">{productDetails(product)}</p>
                        </div>
                      </div>
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
                          onClick={() => setProductToDelete(product)}
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
        {products.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={products.data.page}
            size={products.data.size}
            total={products.data.totalElements ?? products.data.total}
            totalPages={products.data.totalPages}
          />
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
      <ConfirmDialog
        confirmLabel="Excluir"
        description="Tem certeza que deseja excluir este produto? Esta ação não poderá ser desfeita."
        loading={removeProduct.isPending}
        loadingLabel="Excluindo..."
        onCancel={() => setProductToDelete(null)}
        onConfirm={confirmDelete}
        open={Boolean(productToDelete)}
        title="Excluir produto"
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

function productDetails(product: Product) {
  const details = [
    product.sku ? `SKU ${product.sku}` : null,
    product.barcode ? `Barras ${product.barcode}` : null,
    product.referenceCode ? `Ref. ${product.referenceCode}` : null,
    product.category,
  ].filter(Boolean);

  return details.length > 0 ? details.join(" · ") : "-";
}
