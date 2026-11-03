import { Button } from './Button';

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  if (total <= pageSize) return null;
  return (
    <nav
      aria-label="Paginação"
      className="flex items-center justify-between gap-3 p-4 text-sm text-slate-300"
    >
      <span>
        Página {current} de {pages} · {total} registros
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={current <= 1}
          onClick={() => onChange(current - 1)}
        >
          Anterior
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={current >= pages}
          onClick={() => onChange(current + 1)}
        >
          Próxima
        </Button>
      </div>
    </nav>
  );
}
