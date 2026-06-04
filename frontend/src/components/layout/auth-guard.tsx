"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe } from "@/features/auth/auth-service";
import { clearToken, getToken } from "@/features/auth/auth-storage";

type AuthGuardProps = {
  children: React.ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [token] = useState<string | null>(() =>
    typeof window === "undefined" ? null : getToken(),
  );

  const session = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: () => getMe(token ?? ""),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    if (!token) {
      clearToken();
      router.replace("/login");
      return;
    }

    if (session.isError) {
      clearToken();
      router.replace("/login");
    }
  }, [router, session.isError, token]);

  if (!token || session.isLoading || session.isError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-page px-6">
        <div className="rounded-lg border border-border bg-panel p-5 text-sm font-medium text-muted shadow-subtle">
          Validando sessão...
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
