import { Boxes, FileText, Users } from "lucide-react";

const cards = [
  { label: "Clientes", value: "0", icon: Users },
  { label: "Produtos", value: "0", icon: Boxes },
  { label: "Orçamentos", value: "0", icon: FileText },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-page">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary">StockFlow</p>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        </div>

        <section className="grid gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <article
              className="rounded-lg border border-border bg-panel p-5 shadow-subtle"
              key={card.label}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-ink">
                    {card.value}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-primary">
                  <card.icon size={21} aria-hidden="true" />
                </span>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
