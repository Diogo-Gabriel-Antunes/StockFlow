import { apiRequest } from "@/services/http";
import type { ActivityLogPage, NotificationPage, NotificationType } from "./types";

type NotificationParams = {
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  size?: number;
  status?: "all" | "unread" | "read";
  type?: NotificationType | "";
};

type ActivityLogParams = {
  actorType?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  entityId?: string;
  entityType?: string;
  page?: number;
  size?: number;
};

export function listNotifications(token: string, params: NotificationParams = {}) {
  return apiRequest<NotificationPage>(`/notifications${query(params)}`, { token });
}

export function unreadNotificationCount(token: string) {
  return apiRequest<{ count: number }>("/notifications/unread-count", { token });
}

export function markNotificationRead(token: string, id: string) {
  return apiRequest(`/notifications/${id}/read`, { method: "POST", token });
}

export function markAllNotificationsRead(token: string) {
  return apiRequest<{ updated: number }>("/notifications/read-all", { method: "POST", token });
}

export function listActivityLogs(token: string, params: ActivityLogParams = {}) {
  return apiRequest<ActivityLogPage>(`/activity-logs${query(params)}`, { token });
}

function query(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });
  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}
