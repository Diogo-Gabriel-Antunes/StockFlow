"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/table";
import { getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./notification-service";
import { notificationLabel } from "./notification-bell";
import type { NotificationItem, NotificationType } from "./types";

const notificationTypes: Array<"" | NotificationType> = [
  "",
  "QUOTE_APPROVED",
  "QUOTE_REJECTED",
  "QUOTE_COMPLETED",
  "QUOTE_REQUEST_CREATED",
  "QUOTE_REQUEST_CANCELLED",
  "QUOTE_REQUEST_CONVERTED",
  "STOCK_LOW",
  "STOCK_OUT",
  "RESTOCK_REGISTERED",
];

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const [token] = useState<string | null>(() => (typeof window === "undefined" ? null : getToken()));
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const [type, setType] = useState<"" | NotificationType>("");
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  const notifications = useQuery({
    queryKey: ["notifications", token, status, type, page, size],
    queryFn: () => listNotifications(token ?? "", { page, size, status, type }),
    enabled: Boolean(token),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(token ?? "", id),
    onSuccess: () => {
      appToast.success("Notificação marcada como lida.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível marcar a notificação como lida.")),
  });

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(token ?? ""),
    onSuccess: () => {
      appToast.success("Todas as notificações foram marcadas como lidas.");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível marcar as notificações como lidas.")),
  });

  useEffect(() => {
    if (notifications.isError) {
      appToast.error("Não foi possível carregar as notificações.");
    }
  }, [notifications.isError]);

  function changeSize(value: number) {
    setPage(0);
    setSize(value);
  }

  function changeStatus(value: "all" | "unread" | "read") {
    setPage(0);
    setStatus(value);
  }

  function changeType(value: "" | NotificationType) {
    setPage(0);
    setType(value);
  }

  return (
    <AppLayout maxWidth="wide">
      <PageHeader
        action={
          <Button disabled={markAll.isPending} onClick={() => markAll.mutate()} variant="secondary">
            <CheckCheck size={17} aria-hidden="true" />
            Marcar todas como lidas
          </Button>
        }
        eyebrow="Central"
        subtitle="Acompanhe eventos importantes do portal, propostas, estoque e solicitações."
        title="Notificações"
      />

      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 shadow-subtle sm:flex-row sm:items-center">
        <select
          className="h-11 rounded-md border border-border bg-slate-950/40 px-3 text-sm text-ink outline-none focus:border-primary"
          onChange={(event) => changeStatus(event.target.value as "all" | "unread" | "read")}
          value={status}
        >
          <option value="all">Todas</option>
          <option value="unread">Não lidas</option>
          <option value="read">Lidas</option>
        </select>
        <select
          className="h-11 rounded-md border border-border bg-slate-950/40 px-3 text-sm text-ink outline-none focus:border-primary"
          onChange={(event) => changeType(event.target.value as "" | NotificationType)}
          value={type}
        >
          {notificationTypes.map((option) => (
            <option key={option || "all"} value={option}>
              {option ? notificationLabel(option) : "Todos os tipos"}
            </option>
          ))}
        </select>
      </div>

      <Card className="overflow-hidden">
        {notifications.isLoading ? <LoadingState text="Carregando notificações..." /> : null}
        {notifications.isError ? <ErrorState text="Não foi possível carregar as notificações." /> : null}
        {notifications.data && notifications.data.items.length === 0 ? (
          <EmptyState
            description="Quando algo importante acontecer, as notificações aparecerão aqui."
            icon={<Bell size={20} aria-hidden="true" />}
            title="Nenhuma notificação encontrada."
          />
        ) : null}
        <div className="divide-y divide-border">
          {notifications.data?.items.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={() => markRead.mutate(notification.id)}
            />
          ))}
        </div>
        {notifications.data ? (
          <PaginationControls
            onPageChange={setPage}
            onSizeChange={changeSize}
            page={page}
            size={size}
            total={notifications.data.totalElements}
            totalPages={notifications.data.totalPages}
          />
        ) : null}
      </Card>
    </AppLayout>
  );
}

function NotificationRow({
  notification,
  onMarkRead,
}: {
  notification: NotificationItem;
  onMarkRead: () => void;
}) {
  return (
    <article className={`grid gap-3 px-5 py-4 ${notification.read ? "" : "bg-sky-950/20"}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-ink">{notification.title}</h2>
            <Badge tone={notification.read ? "neutral" : "info"}>{notification.read ? "Lida" : "Não lida"}</Badge>
            <Badge tone="slate">{notificationLabel(notification.type)}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted">{notification.message}</p>
          <p className="mt-1 text-xs text-muted">{formatDate(notification.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {notification.link ? (
            <Link
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-panel px-3 text-sm font-semibold text-ink transition hover:bg-slate-800"
              href={notification.link}
            >
              <ExternalLink size={15} aria-hidden="true" />
              Abrir
            </Link>
          ) : null}
          {!notification.read ? (
            <Button onClick={onMarkRead} size="sm" variant="secondary">
              Marcar como lida
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
