"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getToken } from "@/features/auth/auth-storage";
import { appToast, getApiErrorMessage } from "@/lib/toast";
import { listNotifications, markNotificationRead, unreadNotificationCount } from "./notification-service";
import type { NotificationItem } from "./types";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [token] = useState<string | null>(() => (typeof window === "undefined" ? null : getToken()));
  const wrapperRef = useRef<HTMLDivElement>(null);

  const count = useQuery({
    queryKey: ["notifications-unread-count", token],
    queryFn: () => unreadNotificationCount(token ?? ""),
    enabled: Boolean(token),
    refetchInterval: 60000,
  });

  const notifications = useQuery({
    queryKey: ["notifications-dropdown", token],
    queryFn: () => listNotifications(token ?? "", { page: 0, size: 5, status: "unread" }),
    enabled: Boolean(token && open),
  });

  const markRead = useMutation({
    mutationFn: (notification: NotificationItem) => markNotificationRead(token ?? "", notification.id),
    onSuccess: (_data, notification) => {
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-dropdown"] });
      if (notification.link) {
        router.push(notification.link);
        setOpen(false);
      }
    },
    onError: (error) => appToast.error(getApiErrorMessage(error, "Não foi possível abrir a notificação.")),
  });

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const unread = count.data?.count ?? 0;

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        aria-label="Abrir notificações"
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-panel text-ink shadow-subtle transition hover:bg-slate-800"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <Bell size={18} aria-hidden="true" />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[11px] font-semibold leading-none text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <section className="absolute right-0 z-[70] mt-2 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-slate-950/30">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-ink">Notificações</h2>
            <Link className="text-xs font-semibold text-primary" href="/notifications" onClick={() => setOpen(false)}>
              Ver todas
            </Link>
          </header>
          {notifications.isLoading ? (
            <p className="px-4 py-5 text-sm text-muted">Carregando notificações...</p>
          ) : null}
          {notifications.data && notifications.data.items.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted">Nenhuma notificação nova.</p>
          ) : null}
          <div className="max-h-96 divide-y divide-border overflow-y-auto">
            {notifications.data?.items.map((notification) => (
              <button
                className="grid w-full gap-1 px-4 py-3 text-left transition hover:bg-slate-900/70"
                key={notification.id}
                onClick={() => markRead.mutate(notification)}
                type="button"
              >
                <span className="text-sm font-semibold text-ink">{notification.title}</span>
                <span className="text-xs leading-5 text-muted">{notification.message}</span>
                <span className="text-[11px] font-medium uppercase text-primary">{notificationLabel(notification.type)}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function notificationLabel(type: string) {
  const labels: Record<string, string> = {
    QUOTE_APPROVED: "Proposta aprovada",
    QUOTE_REJECTED: "Proposta recusada",
    QUOTE_COMPLETED: "Orçamento concluído",
    QUOTE_REQUEST_CREATED: "Nova solicitação",
    QUOTE_REQUEST_CANCELLED: "Solicitação cancelada",
    QUOTE_REQUEST_CONVERTED: "Solicitação convertida",
    STOCK_LOW: "Estoque baixo",
    STOCK_OUT: "Sem estoque",
    RESTOCK_REGISTERED: "Reposição",
  };
  return labels[type] ?? type;
}
