import type { ReactNode } from "react";

type PageHeaderProps = {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  subtitle?: string;
  title: string;
};

export function PageHeader({
  action,
  description,
  eyebrow,
  subtitle,
  title,
}: PageHeaderProps) {
  const helperText = description ?? subtitle;

  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">{title}</h1>
        {helperText ? (
          <p className="mt-2 text-sm leading-6 text-muted">{helperText}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0 sm:pt-1">{action}</div> : null}
    </header>
  );
}
