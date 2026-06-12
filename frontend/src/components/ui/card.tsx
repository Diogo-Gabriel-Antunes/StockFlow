import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-panel shadow-subtle ${className ?? ""}`}>
      {children}
    </section>
  );
}

export function CardHeader({
  action,
  children,
  className,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={`flex flex-wrap items-start justify-between gap-3 border-b border-border bg-slate-900/50 px-5 py-4 dark:bg-slate-800/[0.02] ${className ?? ""}`}
    >
      <div>{children}</div>
      {action}
    </header>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-semibold text-ink">{children}</h2>;
}

export function CardDescription({ children }: { children: ReactNode }) {
  return <p className="mt-1 text-sm text-muted">{children}</p>;
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className ?? "p-5"}>{children}</div>;
}
