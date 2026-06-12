"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/table";
import { getToken } from "@/features/auth/auth-storage";
import { appToast } from "@/lib/toast";
import { listActivityLogs } from "./notification-service";
import { notificationLabel } from "./notification-bell";

export function ActivityLogsPage() {
  const [token] = useState<string | null>(() => (typeof window === "undefined" ? null : getToken()));
  const [entityType, setEntityType] = useState("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const logs = useQuery({
    queryKey: ["activity-logs", token, entityType, page, size],
    queryFn: () => listActivityLogs(token ?? "", { entityType, page, size }),
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (logs.isError) {
      appToast.error("Não foi possível carregar o histórico de atividades.");
    }
  }, [logs.isError]);

  function changeSize(value: number) {
    setPage(0);
    setSize(value);
  }

  function changeEntityType(value: string) {
    setPage(0);
    setEntityType(value);
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        eyebrow="Auditoria"
        subtitle="Histórico operacional simples dos principais eventos da empresa."
        title="Histórico de atividades"
      />

      <div className="mb-5 rounded-xl border border-border bg-panel p-3 shadow-subtle">
        <select
          className="h-11 rounded-md border border-border bg-slate-950/40 px-3 text-sm text-ink outline-none focus:border-primary"
          onChange={(event) => changeEntityType(event.target.value)}
          value={entityType}
        >
          <option value="">Todas as entidades</option>
          <option value="QUOTE">Orçamentos</option>
          <option value="QUOTE_REQUEST">Solicitações</option>
          <option value="PRODUCT">Produtos/Estoque</option>
        </select>
      </div>

      <Card className="overflow-hidden">
        {logs.isLoading ? <LoadingState text="Carregando atividades..." /> : null}
        {logs.isError ? <ErrorState text="Não foi possível carregar as atividades." /> : null}
        {logs.data && logs.data.items.length === 0 ? (
          <EmptyState
            description="Eventos importantes da empresa serão registrados aqui."
            icon={<ClipboardList size={20} aria-hidden="true" />}
            title="Nenhuma atividade encontrada."
          />
        ) : null}
        <div className="divide-y divide-border">
          {logs.data?.items.map((activity) => (
            <article className="grid gap-2 px-5 py-4" key={activity.id}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={actorTone(activity.actorType)}>{actorLabel(activity.actorType)}</Badge>
                <Badge tone="slate">{notificationLabel(activity.action)}</Badge>
                {activity.entityType ? <Badge tone="neutral">{activity.entityType}</Badge> : null}
              </div>
              <p className="text-sm font-medium text-ink">{activity.description}</p>
              <p className="text-xs text-muted">{formatDate(activity.createdAt)}</p>
            </article>
          ))}
        </div>
        {logs.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={page}
            size={size}
            total={logs.data.totalElements}
            totalPages={logs.data.totalPages}
          />
        ) : null}
      </Card>
    </AppLayout>
  );
}

function actorLabel(actorType: string) {
  const labels: Record<string, string> = {
    CUSTOMER: "Cliente",
    INTERNAL_USER: "Usuário interno",
    SYSTEM: "Sistema",
  };
  return labels[actorType] ?? actorType;
}

function actorTone(actorType: string): "info" | "warning" | "success" {
  if (actorType === "CUSTOMER") {
    return "info";
  }
  if (actorType === "SYSTEM") {
    return "warning";
  }
  return "success";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
