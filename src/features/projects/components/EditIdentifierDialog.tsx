import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { Projeto } from '@/types';
import { projectsService } from '../services/projectsService';
import { normalizeSubsequence } from '../domain/identifier';

type Props = {
  project: Projeto;
  onClose: () => void;
  onSaved: (updated: Projeto) => void;
};

export const EditIdentifierDialog: React.FC<Props> = ({ project, onClose, onSaved }) => {
  const [sequence, setSequence] = useState(String(project.sequence));
  const [subsequente, setSubsequente] = useState(project.subsequente ?? '');
  const [saving, setSaving] = useState(false);
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

  const handleSave = async () => {
    const seq = Number(sequence);
    if (!Number.isInteger(seq) || seq <= 0) {
      setError('Sequência deve ser um número inteiro positivo.');
      return;
    }
    const normalizedSubsequence = normalizeSubsequence(subsequente);
    if (
      normalizedSubsequence &&
      (!/^[A-Z0-9-]+$/.test(normalizedSubsequence) || normalizedSubsequence.length > 20)
    ) {
      setError('Subsequente deve ter até 20 caracteres, usando letras, números ou hífen.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await projectsService.update(project.id, {
        sequence: seq,
        subsequente: normalizedSubsequence || null,
      });
      onSaved(updated as unknown as Projeto);
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Não foi possível atualizar o identificador.';
      setError(
        /unique|duplicate|duplicad|já.*uso/i.test(message)
          ? 'Este identificador já está sendo usado por outro projeto.'
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-100">Editar Identificador</h2>

        <div className="mt-4 space-y-3">
          <Input
            label="Sequência"
            type="number"
            min={1}
            value={sequence}
            onChange={(e) => setSequence(e.target.value)}
          />
          <Input
            label="Subsequente"
            type="text"
            placeholder="Opcional"
            value={subsequente}
            onChange={(e) => setSubsequente(e.target.value)}
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onMouseDown={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={handleClose}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-slate-900/50 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-all duration-200 hover:border-cyan-300/45 hover:bg-slate-800/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <Button type="button" loading={saving} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return dialog;
  }

  return createPortal(dialog, document.body);
};
