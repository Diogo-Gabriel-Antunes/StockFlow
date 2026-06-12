export type NotificationType =
  | "QUOTE_APPROVED"
  | "QUOTE_REJECTED"
  | "QUOTE_COMPLETED"
  | "QUOTE_REQUEST_CREATED"
  | "QUOTE_REQUEST_CANCELLED"
  | "QUOTE_REQUEST_CONVERTED"
  | "STOCK_LOW"
  | "STOCK_OUT"
  | "RESTOCK_REGISTERED";

export type NotificationItem = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  sourceType: string | null;
  sourceId: string | null;
  link: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPage = {
  items: NotificationItem[];
  content: NotificationItem[];
  page: number;
  size: number;
  total: number;
  totalElements: number;
  totalPages: number;
};

export type ActivityLog = {
  id: string;
  actorType: "INTERNAL_USER" | "CUSTOMER" | "SYSTEM";
  actorUserId: string | null;
  actorCustomerId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  description: string;
  metadata: string | null;
  createdAt: string;
};

export type ActivityLogPage = {
  items: ActivityLog[];
  content: ActivityLog[];
  page: number;
  size: number;
  total: number;
  totalElements: number;
  totalPages: number;
};
