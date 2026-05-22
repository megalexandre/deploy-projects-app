import React from 'react';
import { Card, CardContent } from '@/shared/components/Card';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { type KanbanStatus } from '../kanban/kanbanConfig';
import type { ProjetoKanbanCard } from '../pages/ProjetosPage';
import { ProjetoCard } from './ProjectCard';

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

  return (
    <Card className={`w-[340px] shrink-0 snap-start border ${column.className}`}>
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
          className="space-y-3"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            if (!canManageStatus) return;
            event.preventDefault();
            onDrop(column.id, event);
          }}
        >
          {projetos.map((projeto) => (
            <ProjetoCard
              key={projeto.id}
              projeto={projeto}
              draggedId={draggedId}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onStatusChange={onStatusChange}
            />
          ))}

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
