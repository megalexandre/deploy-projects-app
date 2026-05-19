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
  updatingStatus: boolean;
  onCommentChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export const StatusChangeDialog: React.FC<Props> = ({
  pendingStatusChange,
  statusComment,
  updatingStatus,
  onCommentChange,
  onConfirm,
  onCancel,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <h2 className="text-xl font-semibold text-slate-100">Atualizar status</h2>
      <p className="mt-2 text-sm text-slate-400">
        Novo status:{' '}
        <span className="text-slate-200">{getStatusLabel(pendingStatusChange.nextStatus)}</span>
      </p>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-300">Comentario</label>
        <textarea
          value={statusComment}
          onChange={(event) => onCommentChange(event.target.value)}
          rows={5}
          placeholder="Escreva um comentario sobre esta alteracao de status..."
          className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
        />
      </div>

      <div className="mt-5 flex justify-end gap-3">
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            if (!updatingStatus) onCancel();
          }}
        >
          Cancelar
        </Button>
        <Button type="button" loading={updatingStatus} onClick={onConfirm}>
          Salvar
        </Button>
      </div>
    </div>
  </div>
);
