import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

type PaginationControlsProps = {
  page: number;
  size: number;
  total: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
};

const pageSizes = [10, 20, 50, 100];

export function PaginationControls({
  onPageChange,
  onSizeChange,
  page,
  size,
  total,
  totalPages,
}: PaginationControlsProps) {
  const pages = totalPages ?? (total > 0 ? Math.ceil(total / size) : 0);
  const currentPage = pages === 0 ? 0 : page + 1;
  const isFirst = page <= 0;
  const isLast = pages === 0 || page >= pages - 1;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <span>Total de registros: {total}</span>
        <label className="flex items-center gap-2">
          <span>Itens por página</span>
          <select
            className="h-9 rounded-md border border-border bg-white px-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-slate-950/40"
            onChange={(event) => onSizeChange(Number(event.target.value))}
            value={size}
          >
            {pageSizes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-3">
        <span>
          Página {currentPage} de {pages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            disabled={isFirst}
            onClick={() => onPageChange(Math.max(page - 1, 0))}
            size="sm"
            type="button"
            variant="secondary"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            Anterior
          </Button>
          <Button
            disabled={isLast}
            onClick={() => onPageChange(page + 1)}
            size="sm"
            type="button"
            variant="secondary"
          >
            Próxima
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
