import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

type AppLayoutProps = {
  children: ReactNode;
  maxWidth?: "default" | "narrow";
};

export function AppLayout({ children, maxWidth = "default" }: AppLayoutProps) {
  const widthClass = maxWidth === "narrow" ? "max-w-3xl" : "max-w-6xl";

  return (
    <main className="min-h-screen bg-page">
      <Sidebar />
      <div className="lg:pl-72">
        <div className={`mx-auto ${widthClass} px-6 py-8 pt-20 lg:pt-8`}>
          {children}
        </div>
      </div>
    </main>
  );
}
