import React, { useCallback, useEffect, useState } from 'react';
import { ArrowsClockwise, Check, Copy, Key, X } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { User as SystemUser } from '@/services';
import { formatRoleLabel } from '../hooks/useUsers';
import { generatePassword } from '../utils/generatePassword';

type Props = {
  user: SystemUser;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
};

export const ResetPasswordDialog: React.FC<Props> = ({ user, onConfirm, onClose }) => {
  const [password, setPassword] = useState(() => generatePassword());
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = useCallback(() => {
    if (saving) return;
    onClose();
  }, [onClose, saving]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [handleClose]);

  const handleRegenerate = () => {
    setPassword(generatePassword());
    setCopied(false);
    setSaved(false);
    setError(null);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setError('Não foi possível copiar automaticamente. Copie a senha manualmente.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onConfirm(password);
      setSaved(true);
    } catch {
      setError('Erro ao redefinir a senha. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-900/50">
              <Key className="h-5 w-5 text-blue-300" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">Resetar senha</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="text-slate-400 transition-colors hover:text-slate-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <Input label="Nome" value={user.name} readOnly />
          <Input label="Email" value={user.email} readOnly />
          <Input label="Perfil" value={formatRoleLabel(user.role)} readOnly />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Nova senha</label>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Input value={password} readOnly className="font-mono tracking-wide" />
              </div>
              <button
                type="button"
                onClick={handleRegenerate}
                title="Gerar outra senha"
                className="shrink-0 rounded-xl border border-white/20 bg-slate-900/50 p-2.5 text-slate-200 transition-colors hover:border-cyan-300/45 hover:bg-slate-800/80"
              >
                <ArrowsClockwise className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleCopy}
                title="Copiar senha"
                className="shrink-0 rounded-xl border border-white/20 bg-slate-900/50 p-2.5 text-slate-200 transition-colors hover:border-cyan-300/45 hover:bg-slate-800/80"
              >
                {copied ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Copie a senha e envie ao usuário. Ela não poderá ser recuperada depois de fechar.
            </p>
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        {saved && (
          <p className="mt-3 text-sm text-emerald-400">
            Senha redefinida com sucesso. Copie e envie ao usuário.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            {saved ? 'Fechar' : 'Cancelar'}
          </Button>
          {!saved && (
            <Button type="button" loading={saving} onClick={handleSave}>
              <Key className="mr-2 h-4 w-4" />
              Redefinir senha
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
