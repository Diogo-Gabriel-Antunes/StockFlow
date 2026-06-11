"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageSearch, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
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
import { listLowStockProducts } from "./stock-service";

export function LowStockPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const lowStock = useQuery({
    queryKey: ["stock", "low", token],
    queryFn: () => listLowStockProducts(token ?? ""),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
    }
  }, [router, token]);

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        action={<ButtonLink href="/stock">Registrar entrada</ButtonLink>}
        eyebrow="Estoque"
        subtitle="Produtos cujo estoque atual está menor ou igual ao estoque mínimo configurado."
        title="Produtos com estoque baixo"
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Itens críticos</CardTitle>
        </CardHeader>
        {lowStock.isLoading ? (
          <LoadingState text="Carregando produtos com estoque baixo..." />
        ) : null}
        {lowStock.isError ? (
          <ErrorState text="Erro ao carregar produtos com estoque baixo." />
        ) : null}
        {lowStock.data && lowStock.data.length === 0 ? (
          <EmptyState
            description="Todos os produtos ativos estão acima do estoque mínimo configurado."
            icon={<PackageSearch size={20} aria-hidden="true" />}
            title="Nenhum produto com estoque baixo no momento."
          />
        ) : null}
        {lowStock.data && lowStock.data.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>SKU</TableHeaderCell>
                  <TableHeaderCell>Código de barras</TableHeaderCell>
                  <TableHeaderCell>Código de referência</TableHeaderCell>
                  <TableHeaderCell>Estoque atual</TableHeaderCell>
                  <TableHeaderCell>Mínimo</TableHeaderCell>
                  <TableHeaderCell>Unidade</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                  <TableHeaderCell>Ações</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {lowStock.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-muted">{product.category ?? "-"}</p>
                    </TableCell>
                    <TableCell>{product.sku ?? "-"}</TableCell>
                    <TableCell>{product.barcode ?? "-"}</TableCell>
                    <TableCell>{product.referenceCode ?? "-"}</TableCell>
                    <TableCell>
                      {product.stockQuantity}
                    </TableCell>
                    <TableCell>
                      {product.minimumStock}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>
                      <Badge tone={product.stockStatus === "OUT_OF_STOCK" ? "danger" : "warning"}>
                        {stockStatusLabel(product.stockStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ButtonLink href={`/products/${product.id}`} size="sm" variant="ghost">
                        <Pencil size={15} aria-hidden="true" />
                        Editar
                      </ButtonLink>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </DataTable>
          </TableShell>
        ) : null}
      </Card>
    </AppLayout>
  );
}

function stockStatusLabel(status: "OUT_OF_STOCK" | "LOW_STOCK") {
  if (status === "OUT_OF_STOCK") {
    return "Sem estoque";
  }
  return "Estoque baixo";
}
