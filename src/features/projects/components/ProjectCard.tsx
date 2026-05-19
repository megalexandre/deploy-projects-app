import { ViewButton } from '@/shared/components/ViewButton';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { Projeto } from '@/types';
import React, { useState } from 'react';
import { useIdentifier } from '../hooks/useIdentifyer';
import { type KanbanStatus } from '../kanban/kanbanConfig';
import { EditIdentifierDialog } from './EditIdentifierDialog';
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
  const [localProjeto, setLocalProjeto] = useState(projeto);
  const [editingIdentifier, setEditingIdentifier] = useState(false);
  const identifier = useIdentifier({ project: localProjeto, isAdmin: canManageStatus });

  return (
    <div
      data-no-drag-scroll="true"
      draggable={canManageStatus}
      onDragStart={(event) => {
        if (!canManageStatus) return;
        onDragStart(localProjeto.id, event);
      }}
      onDragEnd={onDragEnd}
      className={[
        'rounded-xl border border-white/10 bg-slate-900/80 p-4 transition',
        'hover:border-cyan-300/40 hover:bg-slate-800/80',
        canManageStatus ? 'cursor-grab' : 'cursor-default',
        draggedId === localProjeto.id ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div
        className={[
          'mb-2 text-sm font-semibold text-slate-100',
          canManageStatus ? 'cursor-pointer hover:text-cyan-300 transition-colors' : '',
        ].join(' ')}
        onClick={() => canManageStatus && setEditingIdentifier(true)}
      >
        {identifier}
      </div>

      {editingIdentifier && (
        <EditIdentifierDialog
          project={localProjeto}
          onClose={() => setEditingIdentifier(false)}
          onSaved={(updated) => {
            setLocalProjeto(updated);
            setEditingIdentifier(false);
          }}
        />
      )}
      <div className="text-sm text-slate-300">{localProjeto.cliente.nome}</div>
      <div className="mt-1 text-xs text-slate-400">{localProjeto.dadosProjeto.concessionaria}</div>
      <div className="mt-1 text-xs text-slate-400">
        {localProjeto.dadosProjeto.potenciaSistema} kWp
      </div>

      <div className="mt-3 flex items-center gap-2">
        <StatusSelect
          projectId={localProjeto.id}
          status={localProjeto.status}
          canManageStatus={canManageStatus}
          onStatusChange={onStatusChange}
        />

        <ViewButton to={`/projetos/${localProjeto.id}`} />
      </div>
    </div>
  );
};
