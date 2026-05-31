import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle,
  CurrencyDollar,
  PencilSimple,
  PlusCircle,
  TrendDown,
  Wallet,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { formatCurrencyBRL, maskCurrencyBRL, parseCurrencyBRL } from '@/core/utils/masks';
import {
  entityFinanceService,
  type EntityExpense,
  type EntityFinanceScope,
  type EntityFinanceSnapshot,
  type FinanceStatus,
} from '../services/entityFinanceService';

type Props = EntityFinanceScope;

type ExpenseFormState = {
  descricao: string;
  categoria: string;
  valor: string;
  data: string;
  status: FinanceStatus;
};

type ReceiptFormState = {
  descricao: string;
  valor: string;
};

const createEmptyExpenseForm = (): ExpenseFormState => ({
  descricao: '',
  categoria: '',
  valor: '',
  data: new Date().toISOString().slice(0, 10),
  status: 'pendente',
});

const createEmptyReceiptForm = (): ReceiptFormState => ({
  descricao: '',
  valor: '',
});

const formatDate = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
};

const getStatusBadgeClass = (status: FinanceStatus) =>
  status === 'pago'
    ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
    : 'border-amber-400/30 bg-amber-500/10 text-amber-200';

export const EntityFinanceTab: React.FC<Props> = ({
  entityType,
  entityId,
  entityLabel,
  amount,
  createdAt,
}) => {
  const scope = useMemo(
    () => ({ entityType, entityId, entityLabel, amount, createdAt }),
    [amount, createdAt, entityId, entityLabel, entityType],
  );
  const [snapshot, setSnapshot] = useState<EntityFinanceSnapshot | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [receiptFormOpen, setReceiptFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<EntityExpense | null>(null);
  const [form, setForm] = useState<ExpenseFormState>(createEmptyExpenseForm());
  const [receiptForm, setReceiptForm] = useState<ReceiptFormState>(createEmptyReceiptForm());
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      setSnapshot(await entityFinanceService.getSnapshot(scope));
    } catch (error) {
      console.error('Erro ao carregar financeiro vinculado:', error);
      setErrorMessage('Nao foi possivel carregar o financeiro deste item.');
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const resetForm = () => {
    setEditingExpense(null);
    setForm(createEmptyExpenseForm());
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openReceiptForm = () => {
    setReceiptForm({
      descricao: `Recebimento parcial ${entityLabel}`,
      valor: snapshot?.payment.valorPendente
        ? formatCurrencyBRL(snapshot.payment.valorPendente)
        : '',
    });
    setReceiptFormOpen(true);
  };

  const openEditForm = (expense: EntityExpense) => {
    setEditingExpense(expense);
    setForm({
      descricao: expense.descricao,
      categoria: expense.categoria,
      valor: formatCurrencyBRL(expense.valor),
      data: expense.data,
      status: expense.status,
    });
    setFormOpen(true);
  };

  const handleSaveExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const valor = parseCurrencyBRL(form.valor);
    if (
      !form.descricao.trim() ||
      !form.categoria.trim() ||
      !form.data ||
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      setSnapshot(
        await entityFinanceService.saveExpense(scope, {
          id: editingExpense?.id,
          descricao: form.descricao,
          categoria: form.categoria,
          valor,
          data: form.data,
          status: form.status,
        }),
      );
      setFormOpen(false);
      resetForm();
    } catch (error) {
      console.error('Erro ao salvar despesa vinculada:', error);
      setErrorMessage('Nao foi possivel salvar a despesa.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReceipt = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const valor = parseCurrencyBRL(receiptForm.valor);
    if (Number.isNaN(valor) || valor <= 0) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      setSnapshot(
        await entityFinanceService.saveReceipt(scope, {
          descricao: receiptForm.descricao,
          valor,
        }),
      );
      setReceiptForm(createEmptyReceiptForm());
      setReceiptFormOpen(false);
    } catch (error) {
      console.error('Erro ao salvar recebimento vinculado:', error);
      setErrorMessage('Nao foi possivel salvar o recebimento.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentToggle = async () => {
    if (!snapshot) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      setSnapshot(
        await entityFinanceService.setPaymentStatus(
          scope,
          snapshot.payment.status === 'pago' ? 'pendente' : 'pago',
        ),
      );
    } catch (error) {
      console.error('Erro ao atualizar recebimento vinculado:', error);
      setErrorMessage('Nao foi possivel atualizar o recebimento.');
    } finally {
      setLoading(false);
    }
  };

  if (!snapshot) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-400">
          {errorMessage ?? 'Carregando financeiro...'}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {(loading || errorMessage) && (
        <div className="text-sm text-slate-400">
          {loading && 'Sincronizando financeiro com a API...'}
          {errorMessage && <span className="text-red-300">{errorMessage}</span>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Recebido</div>
                <div className="mt-2 text-2xl font-semibold text-emerald-200">
                  {formatCurrencyBRL(snapshot.summary.receitasRecebidas)}
                </div>
              </div>
              <Wallet className="h-8 w-8 text-emerald-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">A Receber</div>
                <div className="mt-2 text-2xl font-semibold text-amber-200">
                  {formatCurrencyBRL(snapshot.summary.receitasPendentes)}
                </div>
              </div>
              <TrendDown className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Saldo</div>
                <div className="mt-2 text-2xl font-semibold text-cyan-200">
                  {formatCurrencyBRL(snapshot.summary.saldo)}
                </div>
              </div>
              <CurrencyDollar className="h-8 w-8 text-cyan-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Despesas</div>
                <div className="mt-2 text-2xl font-semibold text-rose-200">
                  {formatCurrencyBRL(snapshot.summary.despesas)}
                </div>
              </div>
              <TrendDown className="h-8 w-8 text-rose-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Recebimento principal</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Lancamentos parciais ate atingir o valor final de{' '}
                {entityType === 'projeto' ? 'projeto' : 'servico'}.
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" onClick={openReceiptForm} disabled={loading}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Lancar recebimento
              </Button>
              {snapshot.payment.valorPendente > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePaymentToggle}
                  disabled={loading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Quitar restante
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <div className="text-sm text-slate-400">Referencia</div>
            <div className="mt-1 text-slate-100">{snapshot.payment.descricao}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Valor final</div>
            <div className="mt-1 text-slate-100">{formatCurrencyBRL(snapshot.payment.valor)}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Recebido</div>
            <div className="mt-1 text-slate-100">
              {formatCurrencyBRL(snapshot.payment.valorRecebido)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Status</div>
            <div className="mt-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-xs ${getStatusBadgeClass(snapshot.payment.status)}`}
              >
                {snapshot.payment.status === 'pago' ? 'Pago' : 'Pendente'}
              </span>
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">A receber</div>
            <div className="mt-1 text-slate-100">
              {formatCurrencyBRL(snapshot.payment.valorPendente)}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400">Confirmado em</div>
            <div className="mt-1 text-slate-100">
              {snapshot.payment.confirmedAt
                ? new Date(snapshot.payment.confirmedAt).toLocaleString('pt-BR')
                : '-'}
            </div>
          </div>
        </CardContent>
      </Card>

      {receiptFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Novo recebimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveReceipt} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Descricao"
                value={receiptForm.descricao}
                onChange={(event) =>
                  setReceiptForm((current) => ({ ...current, descricao: event.target.value }))
                }
              />
              <Input
                label="Valor recebido"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={receiptForm.valor}
                onChange={(event) =>
                  setReceiptForm((current) => ({
                    ...current,
                    valor: maskCurrencyBRL(event.target.value),
                  }))
                }
                required
              />
              <div className="flex justify-end gap-3 md:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReceiptFormOpen(false);
                    setReceiptForm(createEmptyReceiptForm());
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Salvar recebimento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recebimentos lancados</CardTitle>
        </CardHeader>
        <CardContent>
          {snapshot.receipts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
              Nenhum recebimento registrado para este item.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Descricao
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {snapshot.receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td className="px-4 py-3 text-sm text-slate-100">{receipt.descricao}</td>
                      <td className="px-4 py-3 text-sm text-emerald-200">
                        {formatCurrencyBRL(receipt.valor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatDate(receipt.data)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200">
                          Pago
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {formOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingExpense ? 'Editar despesa' : 'Nova despesa'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveExpense} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Descricao"
                value={form.descricao}
                onChange={(event) =>
                  setForm((current) => ({ ...current, descricao: event.target.value }))
                }
                required
              />
              <Input
                label="Categoria"
                value={form.categoria}
                onChange={(event) =>
                  setForm((current) => ({ ...current, categoria: event.target.value }))
                }
                required
              />
              <Input
                label="Valor"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={form.valor}
                onChange={(event) =>
                  setForm((current) => ({ ...current, valor: maskCurrencyBRL(event.target.value) }))
                }
                required
              />
              <Input
                label="Data"
                type="date"
                value={form.data}
                onChange={(event) =>
                  setForm((current) => ({ ...current, data: event.target.value }))
                }
                required
              />
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block">Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as FinanceStatus,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </label>
              <div className="md:col-span-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {editingExpense ? 'Salvar despesa' : 'Lancar despesa'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Despesas vinculadas</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Lancamentos operacionais associados a {entityLabel}.
              </p>
            </div>
            <Button type="button" onClick={openCreateForm}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Lancar despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {snapshot.expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
              Nenhuma despesa cadastrada para este item.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Descricao
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Categoria
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Data
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {snapshot.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-4 py-3 text-sm text-slate-100">{expense.descricao}</td>
                      <td className="px-4 py-3 text-sm text-slate-300">{expense.categoria}</td>
                      <td className="px-4 py-3 text-sm text-rose-200">
                        {formatCurrencyBRL(expense.valor)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {formatDate(expense.data)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs ${getStatusBadgeClass(expense.status)}`}
                        >
                          {expense.status === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEditForm(expense)}
                        >
                          <PencilSimple className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
