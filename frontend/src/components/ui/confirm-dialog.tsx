"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useId } from "react";
import { Button } from "./button";

type ConfirmDialogVariant = "danger" | "warning" | "default";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ConfirmDialogVariant;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

const iconClasses: Record<ConfirmDialogVariant, string> = {
  danger: "border-red-900/60 bg-red-950/40 text-red-300 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300",
  warning: "border-amber-900/60 bg-amber-950/40 text-amber-300 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300",
  default: "border-sky-900/60 bg-sky-950/40 text-sky-300 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300",
};

export function ConfirmDialog({
  cancelLabel = "Cancelar",
  confirmLabel = "Confirmar",
  description,
  loading = false,
  loadingLabel = "Processando...",
  onCancel,
  onConfirm,
  open,
  title,
  variant = "default",
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
      <button
        aria-label="Cancelar confirmação"
        className="fixed inset-0 cursor-default"
        disabled={loading}
        onClick={onCancel}
        type="button"
      />
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-slate-950/20"
        role="dialog"
      >
        <div className="grid gap-5 px-6 py-6">
          <div className="flex items-start gap-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${iconClasses[variant]}`}>
              <AlertTriangle size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-muted" id={descriptionId}>
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button disabled={loading} onClick={onCancel} type="button" variant="secondary">
              {cancelLabel}
            </Button>
            <Button
              disabled={loading}
              onClick={onConfirm}
              type="button"
              variant={variant === "danger" ? "danger" : "primary"}
            >
              {loading ? loadingLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
