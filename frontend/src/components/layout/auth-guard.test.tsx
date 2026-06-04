import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getMe } from "@/features/auth/auth-service";
import { clearToken, getToken } from "@/features/auth/auth-storage";
import { AuthGuard } from "./auth-guard";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/auth/auth-storage", () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}));

function renderWithQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <div>Conteúdo privado</div>
      </AuthGuard>
    </QueryClientProvider>,
  );
}

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("validates the session before rendering private content", async () => {
    vi.mocked(getToken).mockReturnValue("token-test");

    renderWithQueryClient();

    expect(screen.getByText("Validando sessão...")).toBeInTheDocument();
    expect(await screen.findByText("Conteúdo privado")).toBeInTheDocument();
    expect(getMe).toHaveBeenCalledWith("token-test");
  });

  test("redirects to login when token is missing", async () => {
    vi.mocked(getToken).mockReturnValue(null);

    renderWithQueryClient();

    expect(screen.getByText("Validando sessão...")).toBeInTheDocument();
    await waitFor(() => expect(clearToken).toHaveBeenCalled());
    expect(replace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("Conteúdo privado")).not.toBeInTheDocument();
  });
});
