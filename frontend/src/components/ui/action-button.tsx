import type { ButtonHTMLAttributes, ReactNode } from "react";

type ActionButtonVariant = "default" | "danger";

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ActionButtonVariant;
};

const variantClasses: Record<ActionButtonVariant, string> = {
  default:
    "border-border bg-white text-ink hover:bg-slate-50 dark:bg-slate-950/40 dark:hover:bg-slate-900",
  danger:
    "border-red-200 bg-white text-red-700 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-950/40 dark:text-red-300 dark:hover:bg-red-950/30",
};

export function ActionButton({
  children,
  className,
  type = "button",
  variant = "default",
  ...props
}: ActionButtonProps) {
  return (
    <button
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className ?? ""}`}
      type={type}
      {...props}
    >
      {children}
    </button>
  );
}
