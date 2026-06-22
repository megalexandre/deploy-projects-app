import React from 'react';
import { TrashSimple, X } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import type { User as SystemUser } from '@/services';

type Props = {
  user: SystemUser;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDeleteModal: React.FC<Props> = ({ user, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-900/50">
            <TrashSimple className="h-5 w-5 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Deletar usuário</h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        Tem certeza que deseja deletar o usuário{' '}
        <span className="font-semibold text-slate-200">{user.name}</span>? Esta ação não pode ser
        desfeita.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="border-red-700 bg-red-700 text-white hover:bg-red-600"
          onClick={onConfirm}
        >
          <TrashSimple className="mr-2 h-4 w-4" />
          Deletar
        </Button>
      </div>
    </div>
  </div>
);
