import React, { useState } from 'react';
import { Buildings, MapPinLine } from '@phosphor-icons/react';
import { formatCurrencyBRL } from '@/core/utils/masks';
import { Card, CardContent } from '@/shared/components/Card';
import { ViewButton } from '@/shared/components/ViewButton';
import type { Endereco, Servico, StatusServico } from '@/types';
import { servicosService } from '../services/servicosService';
import {
  DEFAULT_VISIBLE_SERVICES,
  getTipoLabel,
  statusColumnStyles,
} from '../domain/servicosOptions';

type ServiceColumn = { status: StatusServico; etapa: string };

type ServicoCardProps = {
  servico: Servico;
  draggedId: string | null;
  canManageStatus: boolean;
  onDragStart: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onStatusChange: (serviceId: string, nextStatus: StatusServico) => void;
};

type ServicoKanbanColumnProps = {
  column: ServiceColumn;
  servicos: Servico[];
  draggedId: string | null;
  canManageStatus: boolean;
  onDragStart: (id: string, event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDrop: (columnId: StatusServico, event: React.DragEvent<HTMLDivElement>) => void;
  onStatusChange: (serviceId: string, nextStatus: StatusServico) => void;
};

const formatAddressSummary = (endereco?: Endereco) => {
  if (!endereco) {
    return '-';
  }

  return (
    [
      `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ''}`,
      endereco.bairro,
      `${endereco.cidade}${endereco.estado ? `/${endereco.estado}` : ''}`,
    ]
      .filter(Boolean)
      .join(' - ') || '-'
  );
};

const ServicoStatusSelect: React.FC<{
  serviceId: string;
  status: StatusServico;
  canManageStatus: boolean;
  onStatusChange: (serviceId: string, nextStatus: StatusServico) => void;
}> = ({ serviceId, status, canManageStatus, onStatusChange }) => (
  <select
    value={status}
    onChange={(event) => {
      if (!canManageStatus) return;
      onStatusChange(serviceId, event.target.value as StatusServico);
    }}
    disabled={!canManageStatus}
    className="min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950/70 px-2 py-1 text-xs text-slate-200"
  >
    {servicosService.statusFlow.map((option) => (
      <option key={option.status} value={option.status}>
        {option.etapa}
      </option>
    ))}
  </select>
);

const ServicoCard: React.FC<ServicoCardProps> = ({
  servico,
  draggedId,
  canManageStatus,
  onDragStart,
  onDragEnd,
  onStatusChange,
}) => {
  const detailValue =
    servico.tipo === 'alteracao_compartilhamento_credito'
      ? `UC Geradora: ${servico.ucGeradora || '-'}`
      : formatAddressSummary(servico.enderecoObra);

  return (
    <div
      data-no-drag-scroll="true"
      draggable={canManageStatus}
      onDragStart={(event) => {
        if (!canManageStatus) return;
        onDragStart(servico.id, event);
      }}
      onDragEnd={onDragEnd}
      className={[
        'group relative flex flex-col overflow-hidden rounded-xl border border-white/10',
        'bg-[rgba(21,27,43,0.6)] backdrop-blur-[12px] transition-all',
        'hover:border-cyan-300/40 hover:bg-[rgba(21,27,43,0.78)]',
        canManageStatus ? 'cursor-grab' : 'cursor-default',
        draggedId === servico.id ? 'opacity-50' : '',
      ].join(' ')}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#a9c7ff]">
              ID {servico.protocolo}
            </div>
            <h4 className="mt-1 text-xl font-bold leading-tight text-slate-100">{servico.nome}</h4>
          </div>
          <div className="shrink-0 rounded-lg border border-white/10 bg-slate-950/45 px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-200">
            {getTipoLabel(servico.tipo)}
          </div>
        </div>

        <div>
          <p className="text-base font-semibold text-slate-100">{servico.cliente}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Buildings className="h-4 w-4 text-[#43dde6]" />
          <span>Concessionaria {servico.concessionaria || 'nao informada'}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <MapPinLine className="h-4 w-4 text-[#43dde6]" />
          <span>{detailValue}</span>
        </div>

        <p className="text-base font-bold text-[#a9c7ff]">
          {formatCurrencyBRL(servico.valorFinal)}
        </p>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-white/10 bg-black/10 p-3">
        <ServicoStatusSelect
          serviceId={servico.id}
          status={servico.status}
          canManageStatus={canManageStatus}
          onStatusChange={onStatusChange}
        />

        <ViewButton to={`/servicos/${servico.id}`} />
      </div>
    </div>
  );
};

export const ServicoKanbanColumn: React.FC<ServicoKanbanColumnProps> = ({
  column,
  servicos,
  draggedId,
  canManageStatus,
  onDragStart,
  onDragEnd,
  onDrop,
  onStatusChange,
}) => {
  const [showAll, setShowAll] = useState(false);
  const visibleServicos = showAll ? servicos : servicos.slice(0, DEFAULT_VISIBLE_SERVICES);
  const hiddenServicos = servicos.slice(DEFAULT_VISIBLE_SERVICES);
  const hiddenServicesCount = hiddenServicos.length;

  return (
    <Card
      className={`w-[340px] shrink-0 self-start snap-start border ${statusColumnStyles[column.status]}`}
    >
      <CardContent className="p-4">
        <div className="mb-4 flex min-h-12 items-start justify-between gap-3">
          <h2 className="pt-1 text-sm font-semibold uppercase tracking-wide text-slate-200">
            {column.etapa}
          </h2>
          <span className="mt-1 shrink-0 rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-slate-300">
            {servicos.length}
          </span>
        </div>

        <div
          className="max-h-[68vh] space-y-3 overflow-y-auto pr-1"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            if (!canManageStatus) return;
            event.preventDefault();
            onDrop(column.status, event);
          }}
        >
          {visibleServicos.map((servico) => (
            <ServicoCard
              key={servico.id}
              servico={servico}
              draggedId={draggedId}
              canManageStatus={canManageStatus}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onStatusChange={onStatusChange}
            />
          ))}

          {servicos.length > DEFAULT_VISIBLE_SERVICES && (
            <button
              type="button"
              data-no-drag-scroll="true"
              className="w-full rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-slate-900"
              onClick={() => setShowAll((current) => !current)}
            >
              {showAll ? 'Mostrar menos' : `Mostrar mais ${hiddenServicesCount}`}
            </button>
          )}

          {servicos.length === 0 && (
            <div className="flex min-h-[52px] items-center justify-center rounded-xl border border-dashed border-white/15 px-4 py-3 text-center text-sm text-slate-400">
              Nenhum serviço nesta coluna.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
