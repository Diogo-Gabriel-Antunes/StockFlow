import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getToken } from "@/features/auth/auth-storage";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./notification-service";
import { NotificationsPage } from "./notifications-page";

vi.mock("@/components/layout/app-layout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  appToast: { error: vi.fn(), success: vi.fn() },
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock("./notification-bell", () => ({
  notificationLabel: (type: string) => {
    const labels: Record<string, string> = {
      QUOTE_APPROVED: "Proposta aprovada",
      STOCK_LOW: "Estoque baixo",
    };
    return labels[type] ?? type;
  },
}));

vi.mock("./notification-service", () => ({
  listNotifications: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  markNotificationRead: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationsPage />
    </QueryClientProvider>,
  );
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getToken).mockReturnValue("token-test");
    vi.mocked(listNotifications).mockResolvedValue({
      items: [
        {
          id: "notification-1",
          type: "STOCK_LOW",
          title: "Estoque baixo",
          message: "Produto Bandana ficou abaixo do estoque mínimo.",
          sourceType: "PRODUCT",
          sourceId: "product-1",
          link: "/stock/replenishment",
          read: false,
          readAt: null,
          createdAt: "2026-06-10T10:00:00Z",
        },
      ],
      content: [],
      page: 0,
      size: 10,
      total: 1,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(markNotificationRead).mockResolvedValue({
      id: "notification-1",
      type: "STOCK_LOW",
      title: "Estoque baixo",
      message: "Produto Bandana ficou abaixo do estoque mínimo.",
      sourceType: "PRODUCT",
      sourceId: "product-1",
      link: "/stock/replenishment",
      read: true,
      readAt: "2026-06-10T10:01:00Z",
      createdAt: "2026-06-10T10:00:00Z",
    });
    vi.mocked(markAllNotificationsRead).mockResolvedValue({ updated: 1 });
  });

  test("renders notifications and marks one or all as read", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("Produto Bandana ficou abaixo do estoque mínimo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Abrir/i })).toHaveAttribute("href", "/stock/replenishment");

    fireEvent.click(screen.getByRole("button", { name: "Marcar como lida" }));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith("token-test", "notification-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Marcar todas como lidas" }));

    await waitFor(() => {
      expect(markAllNotificationsRead).toHaveBeenCalledWith("token-test");
    });
  });
});
