import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface Props {
  label: string;
  description: string;
  onConfirm: () => Promise<unknown>;
  disabled?: boolean;
}

export function ConfirmActionButton({ label, description, onConfirm, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
      if (event.key !== 'Tab') return;
      const buttons = Array.from(
        dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
      );
      const first = buttons[0];
      const last = buttons.at(-1);
      if (!first) {
        event.preventDefault();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, busy]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a operação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {label}
      </Button>
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              ref={dialog}
              tabIndex={-1}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              className="w-full max-w-lg rounded-xl border border-white/10 bg-slate-900 p-6 text-left text-slate-100"
            >
              <h2 className="text-lg font-semibold">{label}</h2>
              <p className="my-4 whitespace-normal text-sm text-slate-300">{description}</p>
              {error && (
                <p role="alert" className="mb-4 whitespace-normal text-sm text-red-300">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="button" loading={busy} disabled={busy} onClick={() => void confirm()}>
                  Confirmar
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
