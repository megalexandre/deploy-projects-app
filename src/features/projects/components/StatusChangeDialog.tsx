import React from 'react';
import { Button } from '@/shared/components/Button';
import { getStatusLabel, type KanbanStatus } from '../kanban/kanbanConfig';

type PendingStatusChange = {
  projectId: string;
  nextStatus: KanbanStatus;
};

type Props = {
  pendingStatusChange: PendingStatusChange;
  statusComment: string;
  statusStartDate: string;
  statusDurationDays: number;
  updatingStatus: boolean;
  onCommentChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onDurationDaysChange: (value: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const StatusChangeDialog: React.FC<Props> = ({
  pendingStatusChange,
  statusComment,
  statusStartDate,
  statusDurationDays,
  updatingStatus,
  onCommentChange,
  onStartDateChange,
  onDurationDaysChange,
  onConfirm,
  onCancel,
}) => {
  const cancellation = pendingStatusChange.nextStatus === 'projeto_cancelado';
  const reasonMissing = cancellation && !statusComment.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-slate-100">Atualizar status</h2>
        <p className="mt-2 text-sm text-slate-400">
          Novo status:{' '}
          <span className="text-slate-200">{getStatusLabel(pendingStatusChange.nextStatus)}</span>
        </p>

        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-slate-300">
            {cancellation ? 'Motivo do cancelamento' : 'Comentário'}
          </label>
          <textarea
            value={statusComment}
            onChange={(event) => onCommentChange(event.target.value)}
            rows={5}
            placeholder={
              cancellation
                ? 'Informe obrigatoriamente por que o projeto está sendo cancelado...'
                : 'Escreva um comentário sobre esta alteração de status...'
            }
            className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block font-medium">Data inicial do status</span>
            <input
              type="date"
              value={statusStartDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300"
              required
            />
          </label>
          <label className="block text-sm text-slate-300">
            <span className="mb-2 block font-medium">Prazo em dias</span>
            <input
              type="number"
              min={1}
              value={statusDurationDays}
              onChange={(event) => onDurationDaysChange(Number(event.target.value))}
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300"
              required
            />
          </label>
        </div>
        {statusStartDate && statusDurationDays > 0 && (
          <p className="mt-3 text-sm text-cyan-200">
            Vencimento:{' '}
            {new Date(
              new Date(`${statusStartDate}T00:00:00`).setDate(
                new Date(`${statusStartDate}T00:00:00`).getDate() + statusDurationDays,
              ),
            ).toLocaleDateString('pt-BR')}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <Button
            variant="outline"
            type="button"
            onClick={() => {
              if (!updatingStatus) onCancel();
            }}
          >
            Voltar
          </Button>
          <Button
            type="button"
            loading={updatingStatus}
            disabled={
              reasonMissing ||
              !statusStartDate ||
              !Number.isInteger(statusDurationDays) ||
              statusDurationDays < 1
            }
            onClick={onConfirm}
          >
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};
