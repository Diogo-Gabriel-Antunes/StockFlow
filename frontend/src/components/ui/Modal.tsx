"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId } from "react";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "default" | "wide";
};

export function Modal({
  children,
  description,
  isOpen,
  onClose,
  size = "default",
  title,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const widthClass = size === "wide" ? "max-w-5xl" : "max-w-2xl";

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/65 px-4 py-6 backdrop-blur-sm sm:py-10">
      <button
        aria-label="Fechar modal"
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`relative w-full ${widthClass} overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-slate-950/20`}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border bg-slate-50/70 px-6 py-5 dark:bg-white/[0.03]">
          <div>
            <h2 className="text-lg font-semibold text-ink" id={titleId}>{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted" id={descriptionId}>{description}</p>
            ) : null}
          </div>
          <button
            aria-label="Fechar"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-panel text-ink transition hover:bg-slate-50 dark:hover:bg-slate-800"
            onClick={onClose}
            type="button"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>
        <div className="px-6 py-6">{children}</div>
      </section>
    </div>
  );
}
