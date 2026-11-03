import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { ConfirmActionButton } from '@/shared/components/ConfirmActionButton';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { formatCurrencyBRL, maskCurrencyBRL, parseCurrencyBRL } from '@/core/utils/masks';
import {
  financeiroService,
  type LedgerKind,
  type TransacaoFinanceira,
} from '../services/financeiroService';

export function LedgerEntryActions({
  transaction,
  onChanged,
}: {
  transaction: TransacaoFinanceira;
  onChanged: () => Promise<unknown>;
}) {
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(transaction.descricao);
  const [value, setValue] = useState(formatCurrencyBRL(transaction.valor));
  const [date, setDate] = useState(transaction.data);
  const [kind, setKind] = useState<LedgerKind>(transaction.tipo);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!editing) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setEditing(false);
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [editing, busy]);
  // Ownership is checked by the existing API when saving or deleting.
  const allowed = Boolean(user?.id);
  if (!allowed) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setDescription(transaction.descricao);
          setValue(formatCurrencyBRL(transaction.valor));
          setDate(transaction.data);
          setKind(transaction.tipo);
          setError(null);
          setEditing(true);
        }}
      >
        Editar lançamento
      </Button>
      <ConfirmActionButton
        label="Excluir lançamento"
        description={`Excluir definitivamente "${transaction.descricao}" de ${formatCurrencyBRL(transaction.valor)}? Os saldos serão recalculados.`}
        onConfirm={async () => {
          await financeiroService.removeLedger(transaction.id);
          await onChanged();
        }}
      />
      {editing &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Editar lançamento"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-white/10 bg-slate-900 p-6 text-slate-100"
            >
              <h2 className="text-lg font-semibold">Editar lançamento</h2>
              <form
                className="mt-4 space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const amount = parseCurrencyBRL(value);
                  if (!description.trim() || !date || !Number.isFinite(amount) || amount <= 0) {
                    setError('Informe descrição, data e valor maior que zero.');
                    return;
                  }
                  setBusy(true);
                  setError(null);
                  try {
                    await financeiroService.updateLedger(transaction.id, {
                      amount,
                      reason: kind,
                      description: description.trim(),
                      paid_at: date,
                    });
                    await onChanged();
                    setEditing(false);
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : 'Não foi possível atualizar o lançamento.',
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <Input
                  label="Descrição"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  required
                  disabled={busy}
                />
                <Input
                  label="Valor"
                  value={value}
                  onChange={(event) => setValue(maskCurrencyBRL(event.target.value))}
                  required
                  disabled={busy}
                />
                <Input
                  label="Data"
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  disabled={busy}
                />
                <label className="block text-sm">
                  Tipo
                  <select
                    aria-label="Tipo"
                    value={kind}
                    disabled={busy}
                    onChange={(event) => setKind(event.target.value as LedgerKind)}
                    className="mt-1 block w-full rounded border border-white/20 bg-slate-800 p-2"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </label>
                <p className="text-sm text-slate-400">
                  O vínculo atual será preservado. Para alterá-lo, utilize o formulário do
                  financeiro geral.
                </p>
                {error && (
                  <p role="alert" className="text-sm text-red-300">
                    {error}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => setEditing(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" loading={busy}>
                    Salvar alterações
                  </Button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
