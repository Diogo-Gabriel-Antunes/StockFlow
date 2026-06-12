import type { ReactNode } from "react";

type BadgeTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "slate";

const toneClasses: Record<BadgeTone, string> = {
  neutral: "border-border bg-slate-900 text-slate-300 dark:bg-slate-800 dark:text-slate-200",
  info: "border-blue-900/60 bg-blue-950/40 text-blue-300 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  success:
    "border-emerald-900/60 bg-emerald-950/40 text-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning:
    "border-amber-900/60 bg-amber-950/40 text-amber-300 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  danger:
    "border-red-900/60 bg-red-950/40 text-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  blue: "border-blue-900/60 bg-blue-950/40 text-blue-300 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300",
  green:
    "border-emerald-900/60 bg-emerald-950/40 text-emerald-300 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300",
  amber:
    "border-amber-900/60 bg-amber-950/40 text-amber-300 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  red: "border-red-900/60 bg-red-950/40 text-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  slate:
    "border-border bg-slate-800 text-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
