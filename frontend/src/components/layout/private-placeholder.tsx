import { AppLayout } from "./app-layout";

type PrivatePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PrivatePlaceholder({
  eyebrow,
  title,
  description,
}: PrivatePlaceholderProps) {
  return (
    <AppLayout>
      <header className="mb-6">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </header>
      <section className="rounded-lg border border-border bg-panel p-5 shadow-subtle">
        <p className="text-sm text-muted">Tela reservada para a próxima fase do MVP.</p>
      </section>
    </AppLayout>
  );
}
