import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function TableShell({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto">{children}</div>;
}

export function DataTable({ children }: { children: ReactNode }) {
  return (
    <table className="w-full min-w-[760px] border-collapse text-left text-sm">
      {children}
    </table>
  );
}

export function TableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-border bg-slate-900/70 text-xs uppercase tracking-wide text-muted dark:bg-slate-900/70">
      {children}
    </thead>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border last:border-b-0 transition hover:bg-slate-900/60 dark:hover:bg-slate-900/60">
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  align = "left",
  children,
}: {
  align?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <th className={`px-5 py-3.5 font-semibold ${align === "right" ? "text-right" : ""}`}>
      {children}
    </th>
  );
}

export function TableCell({
  align = "left",
  children,
  primary = false,
}: {
  align?: "left" | "right";
  children: ReactNode;
  primary?: boolean;
}) {
  return (
    <td
      className={`px-5 py-4 align-middle ${
        primary ? "font-semibold text-ink" : "text-muted"
      } ${align === "right" ? "text-right" : ""}`}
    >
      {children}
    </td>
  );
}

export function EmptyState({
  action,
  description,
  icon,
  text,
  title,
}: {
  action?: ReactNode;
  description?: string;
  icon?: ReactNode;
  text?: string;
  title?: string;
}) {
  return (
    <div className="grid justify-items-center gap-3 px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-slate-900 text-muted dark:bg-slate-900">
        {icon ?? <Inbox size={20} aria-hidden="true" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{title ?? text}</p>
        {description ? (
          <p className="mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 p-6 text-sm text-muted">
      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorState({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 p-6 text-sm font-medium text-red-300 dark:text-red-300">
      <AlertCircle size={16} aria-hidden="true" />
      {text}
    </div>
  );
}
