"use client";

import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
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
        eyebrow="Reposição"
        subtitle="Acompanhe produtos que precisam de compra ou reposição."
        title="Produtos abaixo do mínimo"
      />

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Itens críticos</CardTitle>
        </CardHeader>
        {lowStock.isLoading ? (
          <LoadingState text="Carregando produtos..." />
        ) : null}
        {lowStock.isError ? (
          <ErrorState text="Não foi possível carregar produtos abaixo do mínimo." />
        ) : null}
        {lowStock.data && lowStock.data.length === 0 ? (
          <EmptyState
            description="Quando algum produto chegar ao estoque mínimo, ele aparecerá aqui com a compra sugerida."
            icon={<PackageSearch size={20} aria-hidden="true" />}
            title="Nenhum produto abaixo do mínimo"
          />
        ) : null}
        {lowStock.data && lowStock.data.length > 0 ? (
          <TableShell>
            <DataTable>
              <TableHead>
                <tr>
                  <TableHeaderCell>Produto</TableHeaderCell>
                  <TableHeaderCell>Estoque atual</TableHeaderCell>
                  <TableHeaderCell>Mínimo</TableHeaderCell>
                  <TableHeaderCell>Compra sugerida</TableHeaderCell>
                </tr>
              </TableHead>
              <tbody>
                {lowStock.data.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell primary>
                      <p className="font-semibold text-ink">{product.name}</p>
                      <p className="text-xs text-muted">{product.sku ?? product.category ?? "-"}</p>
                    </TableCell>
                    <TableCell>
                      {product.stockQuantity} {product.unit}
                    </TableCell>
                    <TableCell>
                      {product.minimumStock} {product.unit}
                    </TableCell>
                    <TableCell>
                      <Badge tone="warning">
                        {product.suggestedPurchaseQuantity} {product.unit}
                      </Badge>
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
