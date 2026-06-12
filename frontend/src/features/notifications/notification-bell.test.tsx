import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getToken } from "@/features/auth/auth-storage";
import { listNotifications, markNotificationRead, unreadNotificationCount } from "./notification-service";
import { NotificationBell } from "./notification-bell";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  appToast: { error: vi.fn(), success: vi.fn() },
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
}));

vi.mock("./notification-service", () => ({
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
  unreadNotificationCount: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationBell />
    </QueryClientProvider>,
  );
}

describe("NotificationBell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getToken).mockReturnValue("token-test");
    vi.mocked(unreadNotificationCount).mockResolvedValue({ count: 2 });
    vi.mocked(listNotifications).mockResolvedValue({
      items: [
        {
          id: "notification-1",
          type: "QUOTE_APPROVED",
          title: "Proposta aprovada",
          message: "Cliente Ana aprovou a proposta ORC-1.",
          sourceType: "QUOTE",
          sourceId: "quote-1",
          link: "/quotes/quote-1",
          read: false,
          readAt: null,
          createdAt: "2026-06-10T10:00:00Z",
        },
      ],
      content: [],
      page: 0,
      size: 5,
      total: 1,
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(markNotificationRead).mockResolvedValue({
      id: "notification-1",
      type: "QUOTE_APPROVED",
      title: "Proposta aprovada",
      message: "Cliente Ana aprovou a proposta ORC-1.",
      sourceType: "QUOTE",
      sourceId: "quote-1",
      link: "/quotes/quote-1",
      read: true,
      readAt: "2026-06-10T10:01:00Z",
      createdAt: "2026-06-10T10:00:00Z",
    });
  });

  test("shows unread count and opens notification link after marking it as read", async () => {
    renderWithQueryClient();

    expect(await screen.findByText("2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Abrir notificações" }));

    expect(await screen.findAllByText("Proposta aprovada")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute("href", "/notifications");

    fireEvent.click(screen.getByRole("button", { name: /Cliente Ana aprovou/ }));

    await waitFor(() => {
      expect(markNotificationRead).toHaveBeenCalledWith("token-test", "notification-1");
      expect(push).toHaveBeenCalledWith("/quotes/quote-1");
    });
  });
});
