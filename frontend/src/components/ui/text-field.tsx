import type { ComponentProps } from "react";

type TextFieldProps = ComponentProps<"input"> & {
  label: string;
  error?: string;
};

export function TextField({ label, error, id, ...props }: TextFieldProps) {
  const fieldId = id ?? props.name;

  return (
    <label className="grid gap-1.5" htmlFor={fieldId}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        className="h-11 rounded-md border border-border bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-teal-100"
        id={fieldId}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-red-700">{error}</span> : null}
    </label>
  );
}
