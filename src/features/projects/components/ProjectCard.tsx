import { LogoAvatar } from '@/shared/components/LogoAvatar';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { Buildings, MapPinLine } from '@phosphor-icons/react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIdentifier } from '../hooks/useIdentifyer';
import { type KanbanStatus } from '../kanban/kanbanConfig';
import type { ProjetoKanbanCard } from '../pages/ProjetosPage';
import { EditIdentifierDialog } from './EditIdentifierDialog';
import { StatusSelect } from './kanban/StatusSelect';

type ProjetoCardProps = {
  projeto: ProjetoKanbanCard;
  draggedId: string | null;
  onDragStart: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onStatusChange: (projectId: string, nextStatus: KanbanStatus) => void;
};

const formatTipoProjeto = (tipoProjeto?: string) => {
  if (tipoProjeto === 'fotovoltaico') return 'Projeto Solar';
  if (tipoProjeto === 'padrao_entrada') return 'Projeto EMUC';
  return tipoProjeto || '-';
};

const formatEnderecoResumo = (projeto: ProjetoKanbanCard) => {
  const endereco = [
    projeto.endereco.logradouro,
    projeto.endereco.numero ? `, ${projeto.endereco.numero}` : '',
    projeto.endereco.bairro ? ` - ${projeto.endereco.bairro}` : '',
    projeto.endereco.cidade ? `, ${projeto.endereco.cidade}` : '',
  ]
    .join('')
    .trim();

  return endereco || 'Endereco nao informado';
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
  const isProjetoSolar = localProjeto.tipoProjeto === 'fotovoltaico';
  const detailValue = isProjetoSolar
    ? `Pot: ${localProjeto.dadosProjeto.potenciaSistema || 0} kWp`
    : formatEnderecoResumo(localProjeto);

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
        'group relative flex flex-col overflow-hidden rounded-xl border border-white/10',
        'bg-[rgba(21,27,43,0.6)] backdrop-blur-[12px] transition-all',
        'hover:border-cyan-300/40 hover:bg-[rgba(21,27,43,0.78)]',
        canManageStatus ? 'cursor-grab' : 'cursor-default',
        draggedId === localProjeto.id ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className={[
                'text-xs font-bold uppercase tracking-[0.2em] text-[#a9c7ff]',
                canManageStatus ? 'cursor-pointer transition-colors hover:text-cyan-200' : '',
              ].join(' ')}
              onClick={() => canManageStatus && setEditingIdentifier(true)}
            >
              ID {identifier}
            </div>
            <h4 className="mt-1 text-xl font-bold leading-tight text-slate-100">
              {formatTipoProjeto(localProjeto.tipoProjeto)}
            </h4>
          </div>

          <div className="shrink-0 rounded-lg border border-white/10 bg-slate-950/45 p-2">
            <LogoAvatar
              src={localProjeto.concessionariaLogo}
              name={localProjeto.dadosProjeto.concessionaria}
              size="lg"
            />
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-slate-100">{localProjeto.cliente.nome}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Buildings className="h-4 w-4 text-[#43dde6]" />
          <span>Concessionaria {localProjeto.dadosProjeto.concessionaria}</span>
        </div>

        {isProjetoSolar ? (
          <p className="text-base font-bold text-[#a9c7ff]">{detailValue}</p>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <MapPinLine className="h-4 w-4 text-[#43dde6]" />
            <span>{detailValue}</span>
          </div>
        )}
      </div>

      {editingIdentifier && (
        <EditIdentifierDialog
          project={localProjeto}
          onClose={() => setEditingIdentifier(false)}
          onSaved={(updated) => {
            setLocalProjeto((current) => ({
              ...updated,
              concessionariaLogo: current.concessionariaLogo,
            }));
            setEditingIdentifier(false);
          }}
        />
      )}

      <div className="mt-auto flex border-t border-white/10 bg-black/10">
        <div className="flex-1 border-r border-white/10 px-3 py-3">
          <StatusSelect
            projectId={localProjeto.id}
            status={localProjeto.status}
            canManageStatus={canManageStatus}
            onStatusChange={onStatusChange}
          />
        </div>
        <Link
          to={`/projetos/${localProjeto.id}`}
          className="flex flex-1 items-center justify-center px-3 py-3 text-sm font-semibold text-[#a9c7ff] transition-all hover:bg-[#a9c7ff]/10"
        >
          Abrir
        </Link>
      </div>
    </div>
  );
};
