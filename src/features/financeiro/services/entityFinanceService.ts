import { createRecordStorage } from '@/core/utils/storage';

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

type EntityFinanceState = {
  paymentStatus: FinanceStatus;
  paymentConfirmedAt?: string;
  expenses: EntityExpense[];
};

export interface EntityFinanceScope {
  entityType: FinanceEntityType;
  entityId: string;
  entityLabel: string;
  amount: number;
  createdAt?: string;
}

export interface EntityFinanceSnapshot {
  payment: {
    descricao: string;
    valor: number;
    data: string;
    status: FinanceStatus;
    confirmedAt?: string;
  };
  expenses: EntityExpense[];
  summary: {
    receitaPrevista: number;
    despesas: number;
    saldo: number;
    despesasPendentes: number;
  };
}

const storage = createRecordStorage<EntityFinanceState>('opj_entity_finance');

const buildStorageKey = (scope: Pick<EntityFinanceScope, 'entityType' | 'entityId'>) =>
  `${scope.entityType}:${scope.entityId}`;

const readState = (
  scope: Pick<EntityFinanceScope, 'entityType' | 'entityId'>,
): EntityFinanceState => {
  const current = storage.read()[buildStorageKey(scope)];
  return {
    paymentStatus: current?.paymentStatus ?? 'pendente',
    paymentConfirmedAt: current?.paymentConfirmedAt,
    expenses: Array.isArray(current?.expenses) ? current.expenses : [],
  };
};

const writeState = (
  scope: Pick<EntityFinanceScope, 'entityType' | 'entityId'>,
  nextState: EntityFinanceState,
) => {
  const current = storage.read();
  current[buildStorageKey(scope)] = nextState;
  storage.write(current);
};

const normalizeDate = (value?: string) => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  return value.includes('T') ? value.slice(0, 10) : value;
};

export const entityFinanceService = {
  getSnapshot(scope: EntityFinanceScope): EntityFinanceSnapshot {
    const state = readState(scope);
    const despesas = state.expenses.reduce((total, item) => total + item.valor, 0);
    const despesasPendentes = state.expenses
      .filter((item) => item.status === 'pendente')
      .reduce((total, item) => total + item.valor, 0);

    return {
      payment: {
        descricao: `${scope.entityType === 'projeto' ? 'Recebimento do projeto' : 'Recebimento do servico'} ${scope.entityLabel}`,
        valor: scope.amount,
        data: normalizeDate(scope.createdAt),
        status: state.paymentStatus,
        confirmedAt: state.paymentConfirmedAt,
      },
      expenses: [...state.expenses].sort((left, right) => right.data.localeCompare(left.data)),
      summary: {
        receitaPrevista: scope.amount,
        despesas,
        saldo: scope.amount - despesas,
        despesasPendentes,
      },
    };
  },

  setPaymentStatus(scope: EntityFinanceScope, status: FinanceStatus) {
    const current = readState(scope);
    writeState(scope, {
      ...current,
      paymentStatus: status,
      paymentConfirmedAt: status === 'pago' ? new Date().toISOString() : undefined,
    });

    return entityFinanceService.getSnapshot(scope);
  },

  saveExpense(scope: EntityFinanceScope, expense: Omit<EntityExpense, 'id'> & { id?: string }) {
    const current = readState(scope);
    const nextExpense: EntityExpense = {
      id: expense.id ?? crypto.randomUUID(),
      descricao: expense.descricao.trim(),
      categoria: expense.categoria.trim(),
      valor: expense.valor,
      data: normalizeDate(expense.data),
      status: expense.status,
    };

    const existingIndex = current.expenses.findIndex((item) => item.id === nextExpense.id);
    const nextExpenses =
      existingIndex >= 0
        ? current.expenses.map((item, index) => (index === existingIndex ? nextExpense : item))
        : [nextExpense, ...current.expenses];

    writeState(scope, {
      ...current,
      expenses: nextExpenses,
    });

    return entityFinanceService.getSnapshot(scope);
  },
};
