import { Search } from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { Button } from "./button";

type DataToolbarProps = {
  children?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void;
  search?: {
    onChange: (value: string) => void;
    placeholder: string;
    value: string;
  };
  submitLabel?: string;
};

export function DataToolbar({
  children,
  onSubmit,
  search,
  submitLabel = "Buscar",
}: DataToolbarProps) {
  const content = (
    <>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        {search ? (
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={17}
            />
            <input
              className="h-11 w-full rounded-md border border-border bg-white pl-9 pr-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40 dark:placeholder:text-slate-500"
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={search.placeholder}
              value={search.value}
            />
          </div>
        ) : null}
        {children}
      </div>
      {onSubmit ? (
        <Button className="h-11 sm:w-auto" type="submit" variant="secondary">
          {submitLabel}
        </Button>
      ) : null}
    </>
  );

  const className =
    "mb-5 flex flex-col gap-3 rounded-xl border border-border bg-panel p-3 shadow-subtle sm:flex-row sm:items-center sm:justify-between";

  if (onSubmit) {
    return (
      <form className={className} onSubmit={onSubmit}>
        {content}
      </form>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
}
