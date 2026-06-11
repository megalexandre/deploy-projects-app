import {
  financeiroService,
  ledgerAmountToNumber,
  ledgerToTransacao,
  type Ledger,
} from './financeiroService';

export type FinanceEntityType = 'projeto' | 'servico';
export type FinanceStatus = 'pago' | 'pendente';

export interface EntityExpense {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  status: FinanceStatus;
}

export interface EntityReceipt {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  status: 'pago';
}

export interface EntityFinanceScope {
  entityType: FinanceEntityType;
  entityId: string;
  entityLabel: string;
  amount: number;
  createdAt?: string;
}

export interface EntityFinanceSnapshot {
  payment: {
    id?: string;
    descricao: string;
    valor: number;
    valorRecebido: number;
    valorPendente: number;
    data: string;
    status: FinanceStatus;
    confirmedAt?: string;
  };
  receipts: EntityReceipt[];
  expenses: EntityExpense[];
  summary: {
    receitaPrevista: number;
    receitasRecebidas: number;
    receitasPendentes: number;
    despesas: number;
    saldo: number;
    despesasPendentes: number;
  };
}

const normalizeDate = (value?: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.includes('T') ? value.slice(0, 10) : value;
};

const getScopeParams = (scope: Pick<EntityFinanceScope, 'entityType' | 'entityId'>) =>
  scope.entityType === 'projeto' ? { project_id: scope.entityId } : { service_id: scope.entityId };

const getPaymentDescription = (scope: EntityFinanceScope) =>
  `${scope.entityType === 'projeto' ? 'Recebimento do projeto' : 'Recebimento do serviço'} ${scope.entityLabel}`;

const sortByDateDesc = <T extends { data: string }>(items: T[]) =>
  [...items].sort((left, right) => right.data.localeCompare(left.data));

const listLedgersByScope = async (scope: EntityFinanceScope) => {
  const ledgers = await financeiroService.listLedgers();

  if (scope.entityType === 'projeto') {
    return ledgers.filter((ledger) => ledger.project_id === scope.entityId);
  }

  return ledgers.filter((ledger) => ledger.service_id === scope.entityId);
};

const ledgerToReceipt = (ledger: Ledger): EntityReceipt => ({
  id: ledger.id,
  descricao: ledger.description?.trim() || 'Recebimento',
  valor: Math.abs(ledgerAmountToNumber(ledger)),
  data: normalizeDate(ledger.created_at),
  status: 'pago',
});

const ledgerToExpense = (ledger: Ledger): EntityExpense => ({
  id: ledger.id,
  descricao: ledger.description?.trim() || 'Despesa do projeto',
  categoria: 'Despesas',
  valor: ledgerAmountToNumber(ledger),
  data: normalizeDate(ledger.created_at),
  status: 'pago',
});

export const entityFinanceService = {
  async getSnapshot(scope: EntityFinanceScope): Promise<EntityFinanceSnapshot> {
    const ledgers = await listLedgersByScope(scope);
    const receipts = sortByDateDesc(
      ledgers.filter((ledger) => ledgerToTransacao(ledger).tipo === 'receita').map(ledgerToReceipt),
    );
    const expenses = sortByDateDesc(
      ledgers.filter((ledger) => ledgerToTransacao(ledger).tipo === 'despesa').map(ledgerToExpense),
    );
    const receitasRecebidas = receipts.reduce((total, item) => total + item.valor, 0);
    const receitasPendentes = Math.max(scope.amount - receitasRecebidas, 0);
    const despesas = expenses.reduce((total, item) => total + item.valor, 0);
    const lastReceipt = receipts[0];

    return {
      payment: {
        id: lastReceipt?.id,
        descricao: getPaymentDescription(scope),
        valor: scope.amount,
        valorRecebido: receitasRecebidas,
        valorPendente: receitasPendentes,
        data: normalizeDate(lastReceipt?.data ?? scope.createdAt),
        status: receitasRecebidas >= scope.amount && scope.amount > 0 ? 'pago' : 'pendente',
        confirmedAt: receitasPendentes === 0 && lastReceipt ? lastReceipt.data : undefined,
      },
      receipts,
      expenses,
      summary: {
        receitaPrevista: scope.amount,
        receitasRecebidas,
        receitasPendentes,
        despesas,
        saldo: receitasRecebidas - despesas,
        despesasPendentes: 0,
      },
    };
  },

  async setPaymentStatus(scope: EntityFinanceScope, status: FinanceStatus) {
    const snapshot = await entityFinanceService.getSnapshot(scope);
    const remainingAmount = Math.max(scope.amount - snapshot.payment.valorRecebido, 0);

    if (status === 'pago' && remainingAmount > 0) {
      await financeiroService.createLedger({
        ...getScopeParams(scope),
        amount: remainingAmount,
        reason: 'receita',
        description: getPaymentDescription(scope),
      });
    }

    if (status === 'pendente') {
      await Promise.all(
        snapshot.receipts.map((receipt) => financeiroService.removeLedger(receipt.id)),
      );
    }

    return entityFinanceService.getSnapshot(scope);
  },

  async saveReceipt(scope: EntityFinanceScope, receipt: { descricao: string; valor: number }) {
    await financeiroService.createLedger({
      ...getScopeParams(scope),
      amount: receipt.valor,
      reason: 'receita',
      description: receipt.descricao.trim() || getPaymentDescription(scope),
    });

    return entityFinanceService.getSnapshot(scope);
  },

  async saveExpense(
    scope: EntityFinanceScope,
    expense: Omit<EntityExpense, 'id'> & { id?: string },
  ) {
    const payload = {
      ...getScopeParams(scope),
      amount: expense.valor,
      reason: 'despesa' as const,
      description: expense.descricao.trim(),
    };

    if (expense.id) {
      await financeiroService.updateLedger(expense.id, payload);
    } else {
      await financeiroService.createLedger(payload);
    }

    return entityFinanceService.getSnapshot(scope);
  },
};
