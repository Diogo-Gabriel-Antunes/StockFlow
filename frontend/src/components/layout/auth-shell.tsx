import { Boxes } from "lucide-react";
import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-teal-50 text-primary">
            <Boxes size={25} aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-primary">StockFlow</p>
          <h1 className="mt-2 max-w-xl text-3xl font-semibold text-ink">
            Orçamento com estoque integrado
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-muted">
            Cadastre clientes, produtos e propostas em um ambiente organizado por empresa.
          </p>
        </section>

        <section className="rounded-lg border border-border bg-panel p-6 shadow-subtle">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-ink">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
