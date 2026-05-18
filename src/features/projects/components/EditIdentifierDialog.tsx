import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { Projeto } from '@/types';
import { projectsService } from '../services/projectsService';

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

  const handleSave = async () => {
    const seq = Number(sequence);
    if (!Number.isInteger(seq) || seq <= 0) {
      setError('Sequência deve ser um número inteiro positivo.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await projectsService.update(project.id, {
        sequence: seq,
        subsequente: subsequente.trim() || null,
      });
      onSaved(updated as unknown as Projeto);
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
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
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" loading={saving} onClick={handleSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
};
