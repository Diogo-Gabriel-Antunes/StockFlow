import { Activity, Boxes, FileText, Users } from "lucide-react";

const modules = [
  {
    title: "Clientes",
    description: "Cadastro e histórico comercial por empresa.",
    icon: Users,
  },
  {
    title: "Produtos",
    description: "Itens físicos, preços e estoque mínimo.",
    icon: Boxes,
  },
  {
    title: "Orçamentos",
    description: "Propostas com cálculo centralizado na API.",
    icon: FileText,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-page">
      <header className="border-b border-border bg-panel">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-medium text-primary">StockFlow</p>
            <h1 className="text-xl font-semibold text-ink">
              Orçamento com estoque integrado
            </h1>
          </div>
          <a
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white shadow-subtle transition hover:bg-teal-800"
            href="/dashboard"
          >
            Abrir painel
          </a>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-border bg-panel p-6 shadow-subtle">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-primary">
              <Activity size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-ink">
                Ambiente técnico pronto
              </h2>
              <p className="text-sm text-muted">
                Frontend Next.js conectado por configuração à API Quarkus.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatusPill label="Frontend" value="Next.js" />
            <StatusPill label="Backend" value="Quarkus" />
            <StatusPill label="Banco" value="PostgreSQL" />
          </div>
        </div>

        <div className="grid gap-3">
          {modules.map((module) => (
            <article
              className="rounded-lg border border-border bg-panel p-4 shadow-subtle"
              key={module.title}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-md bg-amber-50 text-accent">
                  <module.icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink">{module.title}</h3>
                  <p className="mt-1 text-sm text-muted">{module.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-page px-3 py-2">
      <p className="text-xs font-medium uppercase text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
