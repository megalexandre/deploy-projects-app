import React from 'react';
import { Card, CardContent } from '@/shared/components/Card';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { type KanbanStatus } from '../kanban/kanbanConfig';
import type { ProjetoKanbanCard } from '../hooks/useProjetosKanban';
import { ProjetoCard } from './ProjectCard';

const DEFAULT_VISIBLE_PROJECTS = 5;

type Column = { id: KanbanStatus; label: string; className: string };

type KanbanColumnProps = {
  column: Column;
  projetos: ProjetoKanbanCard[];
  draggedId: string | null;
  onDragStart: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDrop: (columnId: KanbanStatus, event: React.DragEvent<HTMLDivElement>) => void;
  onStatusChange: (projectId: string, nextStatus: KanbanStatus) => void;
};

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  projetos,
  draggedId,
  onDragStart,
  onDragEnd,
  onDrop,
  onStatusChange,
}) => {
  const canManageStatus = useCurrentUser()?.isAdmin === true;
  const [showAll, setShowAll] = React.useState(false);
  const visibleProjetos = showAll ? projetos : projetos.slice(0, DEFAULT_VISIBLE_PROJECTS);
  const hiddenProjetos = projetos.slice(DEFAULT_VISIBLE_PROJECTS);
  const hiddenProjectsCount = hiddenProjetos.length;

  return (
    <Card
      className={`w-[340px] min-w-[340px] max-w-[340px] shrink-0 self-start snap-start overflow-hidden border ${column.className}`}
    >
      <CardContent className="min-w-0 p-4">
        <div className="mb-4 flex h-16 shrink-0 items-start justify-between gap-3">
          <h2 className="pt-1 text-sm font-semibold uppercase tracking-wide text-slate-200">
            {column.label}
          </h2>
          <span className="mt-1 shrink-0 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-slate-300">
            {projetos.length}
          </span>
        </div>

        <div
          className="max-h-[68vh] min-w-0 space-y-3 overflow-x-hidden overflow-y-auto pr-1"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            if (!canManageStatus) return;
            event.preventDefault();
            onDrop(column.id, event);
          }}
        >
          {visibleProjetos.map((projeto) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onStatusChange={onStatusChange}
            />
          ))}

          {projetos.length > DEFAULT_VISIBLE_PROJECTS && (
            <button
              type="button"
              data-no-drag-scroll="true"
              className="w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-900"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? 'Mostrar menos' : `Mostrar mais ${hiddenProjectsCount}`}
            </button>
          )}

          {projetos.length === 0 && (
            <div className="flex min-h-[52px] items-center justify-center rounded-xl border border-dashed border-white/15 px-4 py-3 text-center text-sm text-slate-400">
              Nenhum projeto nesta coluna.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
