import { beforeEach, describe, expect, it, vi } from 'vitest';
import { entityFinanceService, type EntityFinanceScope } from './entityFinanceService';
import { financeiroService, type Ledger, type LedgerPayload } from './financeiroService';

vi.mock('./financeiroService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./financeiroService')>();
  return {
    ...actual,
    financeiroService: {
      listFilteredLedgers: vi.fn(),
      createLedger: vi.fn(),
      updateLedger: vi.fn(),
      getLedgerById: vi.fn(),
      removeLedger: vi.fn(),
    },
  };
});

let entries: Ledger[];
const ledger = (id: string, payload: Partial<LedgerPayload>): Ledger => ({
  id,
  amount: String(payload.amount ?? 0),
  amount_cents: Math.round((payload.amount ?? 0) * 100),
  project_id: payload.project_id,
  service_id: payload.service_id,
  reason: payload.reason,
  description: payload.description,
  paid_at: payload.paid_at ?? '2026-11-03',
  created_at: '2026-11-03T12:00:00Z',
  updated_at: '2026-11-03T12:00:00Z',
});

beforeEach(() => {
  vi.clearAllMocks();
  entries = [];
  vi.mocked(financeiroService.listFilteredLedgers).mockImplementation(async (params) =>
    entries.filter(
      (entry) =>
        (!params?.project_id || entry.project_id === params.project_id) &&
        (!params?.service_id || entry.service_id === params.service_id),
    ),
  );
  vi.mocked(financeiroService.createLedger).mockImplementation(async (payload) => {
    const entry = ledger(String(entries.length + 1), payload);
    entries.push(entry);
    return entry;
  });
  vi.mocked(financeiroService.updateLedger).mockImplementation(async (id, payload) => {
    const current = entries.find((entry) => entry.id === id)!;
    const updated = ledger(id, {
      ...current,
      amount: current.amount_cents / 100,
      reason: current.reason as LedgerPayload['reason'],
      description: current.description ?? '',
      ...payload,
    });
    entries = entries.map((entry) => (entry.id === id ? updated : entry));
    return updated;
  });
  vi.mocked(financeiroService.getLedgerById).mockImplementation(
    async (id) => entries.find((entry) => entry.id === id)!,
  );
  vi.mocked(financeiroService.removeLedger).mockImplementation(async (id) => {
    entries = entries.filter((entry) => entry.id !== id);
  });
});

describe.each(['projeto', 'servico'] as const)('financeiro de %s', (entityType) => {
  const scope: EntityFinanceScope = {
    entityType,
    entityId: 'entity-1',
    entityLabel: '123',
    amount: 100,
  };
  const link =
    entityType === 'projeto' ? { project_id: scope.entityId } : { service_id: scope.entityId };

  it('cria, quita, edita e exclui recebimentos recalculando o status', async () => {
    let snapshot = await entityFinanceService.saveReceipt(scope, {
      descricao: 'Primeira parcela',
      valor: 40,
      data: '2026-11-03',
    });
    expect(snapshot.payment.status).toBe('pendente');
    snapshot = await entityFinanceService.saveReceipt(scope, {
      descricao: 'Segunda parcela',
      valor: 60,
      data: '2026-11-03',
    });
    expect(snapshot.payment.status).toBe('pago');
    expect(snapshot.payment.valorPendente).toBe(0);
    snapshot = await entityFinanceService.saveReceipt(scope, {
      id: '2',
      descricao: 'Corrigido',
      valor: 30,
      data: '2026-11-03',
    });
    expect(snapshot.payment.status).toBe('pendente');
    expect(snapshot.payment.valorPendente).toBe(30);
    snapshot = await entityFinanceService.removeEntry(scope, '2');
    expect(snapshot.receipts).toHaveLength(1);
    expect(snapshot.payment.valorPendente).toBe(60);
  });

  it('reconhece quitação lançada pelo financeiro geral e não soma despesas ou registros avulsos', async () => {
    await financeiroService.createLedger({
      ...link,
      amount: 100,
      reason: 'receita',
      description: 'Via financeiro geral',
    });
    await financeiroService.createLedger({ amount: 500, reason: 'receita', description: 'Avulso' });
    await entityFinanceService.saveExpense(scope, {
      descricao: 'Despesa',
      categoria: 'Despesas',
      valor: 30,
      data: '2026-11-03',
      status: 'pago',
    });
    const snapshot = await entityFinanceService.getSnapshot(scope);
    expect(snapshot.payment.status).toBe('pago');
    expect(snapshot.summary.receitasRecebidas).toBe(100);
    expect(snapshot.summary.saldo).toBe(70);
  });

  it('quita apenas o restante e não duplica recebimento quando já está pago', async () => {
    await entityFinanceService.saveReceipt(scope, {
      descricao: 'Parcial',
      valor: 40,
      data: '2026-11-03',
    });
    let snapshot = await entityFinanceService.setPaymentStatus(scope, 'pago');
    expect(snapshot.payment.status).toBe('pago');
    expect(entries[1].amount_cents).toBe(6000);
    snapshot = await entityFinanceService.setPaymentStatus(scope, 'pago');
    expect(snapshot.receipts).toHaveLength(2);
    snapshot = await entityFinanceService.removeEntry(scope, '2');
    expect(snapshot.payment.status).toBe('pendente');
  });

  it('edita e exclui despesas sem afetar o total recebido', async () => {
    await entityFinanceService.saveExpense(scope, {
      descricao: 'Despesa',
      categoria: 'Despesas',
      valor: 30,
      data: '2026-11-03',
      status: 'pago',
    });
    let snapshot = await entityFinanceService.saveExpense(scope, {
      id: '1',
      descricao: 'Corrigida',
      categoria: 'Despesas',
      valor: 20,
      data: '2026-11-03',
      status: 'pago',
    });
    expect(snapshot.summary.despesas).toBe(20);
    expect(snapshot.payment.valorPendente).toBe(100);
    snapshot = await entityFinanceService.removeEntry(scope, '1');
    expect(snapshot.expenses).toEqual([]);
    expect(snapshot.summary.despesas).toBe(0);
  });

  it('não exclui lançamento de outro cadastro', async () => {
    entries.push(ledger('other', { amount: 100, project_id: 'other', service_id: 'other' }));
    await expect(entityFinanceService.removeEntry(scope, 'other')).rejects.toThrow('não pertence');
    expect(financeiroService.removeLedger).not.toHaveBeenCalled();
  });

  it('zera o saldo em centavos sem manter o status pendente', async () => {
    await financeiroService.createLedger({
      ...link,
      amount: 0.1,
      reason: 'receita',
      description: 'Parcela 1',
    });
    await financeiroService.createLedger({
      ...link,
      amount: 0.7,
      reason: 'receita',
      description: 'Parcela 2',
    });
    const snapshot = await entityFinanceService.getSnapshot({ ...scope, amount: 0.8 });
    expect(snapshot.payment.valorPendente).toBe(0);
    expect(snapshot.payment.status).toBe('pago');
  });
});
