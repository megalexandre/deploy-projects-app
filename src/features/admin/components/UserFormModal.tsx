import React from 'react';
import { Eye, EyeSlash, X } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import type { UserForm } from '../hooks/useUsers';

type Props = {
  form: UserForm;
  editingUserId: string | null;
  saving: boolean;
  showPassword: boolean;
  showPasswordConfirmation: boolean;
  onFormChange: (updater: (current: UserForm) => UserForm) => void;
  onTogglePassword: () => void;
  onTogglePasswordConfirmation: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
};

export const UserFormModal: React.FC<Props> = ({
  form,
  editingUserId,
  saving,
  showPassword,
  showPasswordConfirmation,
  onFormChange,
  onTogglePassword,
  onTogglePasswordConfirmation,
  onSubmit,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            {editingUserId ? 'Editar Usuario' : 'Novo Usuario'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {editingUserId
              ? 'Atualize os dados basicos do usuario.'
              : 'Cadastro enviado para POST /auth/register.'}
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-slate-800"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm text-slate-300">Nome</label>
          <input
            value={form.name}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, name: event.target.value }))
            }
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">E-mail</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, email: event.target.value }))
            }
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm text-slate-300">Perfil</label>
          <select
            value={form.role}
            onChange={(event) =>
              onFormChange((current) => ({ ...current, role: event.target.value }))
            }
            className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
          >
            <option value="user">Usuario</option>
            <option value="main">Main</option>
          </select>
        </div>

        {!editingUserId && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) =>
                    onFormChange((current) => ({ ...current, password: event.target.value }))
                  }
                  className="password-visibility-input w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 pr-12 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <button
                  type="button"
                  onClick={onTogglePassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">Confirmar senha</label>
              <div className="relative">
                <input
                  type={showPasswordConfirmation ? 'text' : 'password'}
                  value={form.passwordConfirmation}
                  onChange={(event) =>
                    onFormChange((current) => ({
                      ...current,
                      passwordConfirmation: event.target.value,
                    }))
                  }
                  className="password-visibility-input w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 pr-12 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <button
                  type="button"
                  onClick={onTogglePasswordConfirmation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
                  aria-label={
                    showPasswordConfirmation
                      ? 'Ocultar confirmacao de senha'
                      : 'Mostrar confirmacao de senha'
                  }
                >
                  {showPasswordConfirmation ? (
                    <EyeSlash className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={saving}>
            {editingUserId ? 'Salvar alteracoes' : 'Criar usuario'}
          </Button>
        </div>
      </form>
    </div>
  </div>
);
