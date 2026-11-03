import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import type { Servico } from '@/types';
import { servicosService } from '../services/servicosService';

interface Props {
  service: Servico;
  onClose: () => void;
  onSaved: (updated: Servico) => void;
}

export function EditServiceIdentifierDialog({ service, onClose, onSaved }: Props) {
  const [protocol, setProtocol] = useState(service.protocolo);
  const [subsequence, setSubsequence] = useState(service.subsequencia ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useCallback(() => {
    if (!saving) onClose();
  }, [onClose, saving]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    firstField.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key !== 'Tab') return;
      const fields = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'input:not(:disabled), button:not(:disabled)',
        ) ?? [],
      );
      if (!fields.length) {
        event.preventDefault();
        return;
      }
      if (event.shiftKey && document.activeElement === fields[0]) {
        event.preventDefault();
        fields.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === fields.at(-1)) {
        event.preventDefault();
        fields[0].focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const save = async () => {
    const value = protocol.trim();
    if (!value || value.length > 255 || /[\s/]/.test(value)) {
      setError('Informe um identificador com até 255 caracteres, sem espaços ou barra.');
      return;
    }
    const normalized = subsequence.trim().toUpperCase();
    const nextSubsequence = normalized === '0' ? '' : normalized;
    if (nextSubsequence && (!/^[A-Z0-9-]+$/.test(nextSubsequence) || nextSubsequence.length > 20)) {
      setError('Subsequente deve ter até 20 caracteres, usando letras, números ou hífen.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      onSaved(await servicosService.updateIdentifier(service.id, value, nextSubsequence));
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : 'Não foi possível atualizar o identificador.';
      setError(
        /unique|duplicate|duplicad|já.*uso/i.test(message)
          ? 'Este identificador já está sendo usado por outro serviço.'
          : message,
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={close}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onDragStart={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-identifier-title"
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="service-identifier-title" className="text-lg font-semibold text-slate-100">
          Editar Identificador
        </h2>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!saving) void save();
          }}
        >
          <div className="mt-4 space-y-3">
            <Input
              label="Identificador"
              inputRef={firstField}
              value={protocol}
              maxLength={255}
              disabled={saving}
              onChange={(event) => setProtocol(event.target.value)}
            />
            <Input
              label="Subsequente"
              placeholder="Opcional"
              value={subsequence}
              disabled={saving}
              onChange={(event) => setSubsequence(event.target.value)}
            />
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
