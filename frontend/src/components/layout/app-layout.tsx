import type { ReactNode } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { AuthGuard } from "./auth-guard";
import { Sidebar } from "./sidebar";

type AppLayoutProps = {
  children: ReactNode;
  maxWidth?: "default" | "narrow" | "wide";
};

export function AppLayout({ children, maxWidth = "default" }: AppLayoutProps) {
  return (
    <AuthGuard>
      <main className="min-h-screen bg-page">
        <Sidebar />
        <div className="lg:pl-72">
          <PageShell maxWidth={maxWidth}>{children}</PageShell>
        </div>
      </main>
    </AuthGuard>
  );
}
