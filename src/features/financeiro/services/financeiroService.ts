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
  limit?: number;
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
  const value = reason?.toLowerCase() ?? '';
  return value.includes('despesa') || value.includes('pagamento') || value.includes('custo')
    ? 'despesa'
    : 'receita';
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
    data: (ledger.paid_at || ledger.created_at || new Date().toISOString()).slice(0, 10),
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
