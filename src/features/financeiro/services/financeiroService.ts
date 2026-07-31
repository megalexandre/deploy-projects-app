/** Camada de acesso ao financeiro baseada no contrato /ledgers da API Rails. */
import { apiClient } from '@/shared/api/apiClient';

export type LedgerKind = 'receita' | 'despesa';

export interface Ledger {
  id: string;
  project_id?: string | null;
  service_id?: string | null;
  amount: string;
  amount_cents: number;
  reason?: string | null;
  description?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerListParams {
  page?: number;
  items?: number;
  project_id?: string;
  service_id?: string;
  reason?: string;
  from?: string;
  to?: string;
}

export interface LedgerPage {
  content: Ledger[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface LedgerPayload {
  project_id?: string | null;
  service_id?: string | null;
  amount: number;
  reason: LedgerKind;
  description: string;
  paid_at?: string | null;
}

export interface TransacaoFinanceira {
  id: string;
  descricao: string;
  tipo: LedgerKind;
  valor: number;
  data: string;
  categoria: string;
  status: 'pago';
  projectId?: string | null;
  serviceId?: string | null;
  ledger: Ledger;
}

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalPendentes: number;
}

const toQueryRecord = (params?: LedgerListParams) =>
  params as Record<string, string | number | boolean | undefined | null> | undefined;

const normalizeReason = (reason?: string | null): LedgerKind => {
  const value = reason?.trim().toLowerCase() ?? '';
  if (value === 'despesa') return 'despesa';
  if (value === 'receita') return 'receita';

  return value.includes('despesa') || value.includes('pagamento') || value.includes('custo')
    ? 'despesa'
    : 'receita';
};

const toDateOnly = (date?: string | null) => {
  if (!date) return new Date().toISOString().slice(0, 10);
  const value = date.trim();
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString().slice(0, 10)
    : parsed.toISOString().slice(0, 10);
};

export const ledgerAmountToNumber = (ledger: Pick<Ledger, 'amount' | 'amount_cents'>) => {
  if (Number.isFinite(ledger.amount_cents)) {
    return ledger.amount_cents / 100;
  }

  const numeric = String(ledger.amount)
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const ledgerToTransacao = (ledger: Ledger): TransacaoFinanceira => {
  const rawValor = ledgerAmountToNumber(ledger);
  const tipo = rawValor < 0 ? 'despesa' : normalizeReason(ledger.reason);

  return {
    id: ledger.id,
    descricao: ledger.description?.trim() || 'Lancamento financeiro',
    tipo,
    valor: Math.abs(rawValor),
    data: toDateOnly(ledger.paid_at || ledger.created_at),
    categoria: tipo === 'receita' ? 'Receitas' : 'Despesas',
    status: 'pago',
    projectId: ledger.project_id,
    serviceId: ledger.service_id,
    ledger,
  };
};

export const financeiroService = {
  listLedgers: (params?: LedgerListParams) =>
    apiClient.get<Ledger[]>('/ledgers', { query: toQueryRecord(params) }),

  paginateLedgers: (params?: LedgerListParams) =>
    apiClient.get<LedgerPage>('/ledgers/paginate', { query: toQueryRecord(params) }),

  async listFilteredLedgers(params?: Omit<LedgerListParams, 'page'>) {
    const first = await financeiroService.paginateLedgers({ ...params, page: 1, items: 100 });
    if (first.totalPages <= 1) return first.content;

    const remaining = await Promise.all(
      Array.from({ length: first.totalPages - 1 }, (_, index) =>
        financeiroService.paginateLedgers({ ...params, page: index + 2, items: 100 }),
      ),
    );
    return [first, ...remaining].flatMap((page) => page.content);
  },

  getLedgerById: (id: string) => apiClient.get<Ledger>(`/ledgers/${id}`),

  createLedger: (payload: LedgerPayload) => apiClient.post<Ledger>('/ledgers', payload),

  updateLedger: (id: string, payload: Partial<LedgerPayload>) =>
    apiClient.patch<Ledger>(`/ledgers/${id}`, payload),

  removeLedger: async (id: string) => {
    await apiClient.delete(`/ledgers/${id}`);
  },

  async listTransacoes(params?: LedgerListParams) {
    const ledgers = await financeiroService.listLedgers(params);
    return ledgers.map(ledgerToTransacao);
  },

  async getResumo(): Promise<ResumoFinanceiro> {
    const transacoes = await financeiroService.listTransacoes();
    const totalReceitas = transacoes
      .filter((item) => item.tipo === 'receita')
      .reduce((total, item) => total + item.valor, 0);
    const totalDespesas = transacoes
      .filter((item) => item.tipo === 'despesa')
      .reduce((total, item) => total + item.valor, 0);

    return {
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      totalPendentes: 0,
    };
  },
};
