import { ViewButton } from '@/shared/components/ViewButton';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { Projeto } from '@/types';
import React from 'react';
import { useIdentifier } from '../hooks/useIdentifyer';
import { type KanbanStatus } from '../kanban/kanbanConfig';
import { StatusSelect } from './kanban/StatusSelect';

type ProjetoCardProps = {
  projeto: Projeto;
  draggedId: string | null;
  onDragStart: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onStatusChange: (projectId: string, nextStatus: KanbanStatus) => void;
};

export const ProjetoCard: React.FC<ProjetoCardProps> = ({
  projeto,
  draggedId,
  onDragStart,
  onDragEnd,
  onStatusChange,
}) => {

  const currentUser = useCurrentUser();
  const canManageStatus = currentUser?.isAdmin === true;
  const identifier = useIdentifier({project: projeto, isAdmin: canManageStatus});

  return (

    <div
      draggable={canManageStatus}
      onDragStart={(event) => {
        if (!canManageStatus) return;
        onDragStart(projeto.id, event);
      }}
      onDragEnd={onDragEnd}
      className={[
        'rounded-xl border border-white/10 bg-slate-900/80 p-4 transition',
        'hover:border-cyan-300/40 hover:bg-slate-800/80',
        canManageStatus ? 'cursor-grab' : 'cursor-default',
        draggedId === projeto.id ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="mb-2 text-sm font-semibold text-slate-100">{identifier}</div>
      <div className="text-sm text-slate-300">{projeto.cliente.nome}</div>
      <div className="mt-1 text-xs text-slate-400">{projeto.dadosProjeto.concessionaria}</div>
      <div className="mt-1 text-xs text-slate-400">{projeto.dadosProjeto.potenciaSistema} kWp</div>

      <div className="mt-3 flex items-center gap-2">
        <StatusSelect
          projectId={projeto.id}
          status={projeto.status}
          canManageStatus={canManageStatus}
          onStatusChange={onStatusChange}
        />

        <ViewButton to={`/projetos/${projeto.id}`} />
      </div>
    </div>
  );
};
