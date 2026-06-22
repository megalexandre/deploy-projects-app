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
  const hiddenProjectsCount = Math.max(projetos.length - visibleProjetos.length, 0);

  return (
    <Card className={`w-[340px] shrink-0 self-start snap-start border ${column.className}`}>
      <CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            {column.label}
          </h2>
          <span className="rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-slate-300">
            {projetos.length}
          </span>
        </div>

        <div
          className="max-h-[68vh] space-y-3 overflow-y-auto pr-1"
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
              className="w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-900"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? 'Mostrar menos' : `Mostrar mais ${hiddenProjectsCount}`}
            </button>
          )}

          {projetos.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-slate-400">
              Nenhum projeto nesta coluna.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
