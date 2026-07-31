import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/api/apiClient';
import { financeiroService, ledgerToTransacao, type LedgerPage } from './financeiroService';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const page = (number: number, totalPages: number, ids: string[]): LedgerPage => ({
  content: ids.map((id) => ({
    id,
    project_id: 'project-1',
    amount: 'R$ 10,00',
    amount_cents: 1000,
    reason: 'receita',
    created_at: '2026-07-30T00:00:00Z',
    updated_at: '2026-07-30T00:00:00Z',
  })),
  totalElements: ids.length * totalPages,
  totalPages,
  size: 100,
  number,
  numberOfElements: ids.length,
  first: number === 0,
  last: number === totalPages - 1,
  empty: ids.length === 0,
});

describe('financeiroService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pagina lançamentos filtrados usando items e project_id', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(page(0, 2, ['ledger-1']))
      .mockResolvedValueOnce(page(1, 2, ['ledger-2']));

    const ledgers = await financeiroService.listFilteredLedgers({ project_id: 'project-1' });

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/ledgers/paginate', {
      query: { project_id: 'project-1', page: 1, items: 100 },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/ledgers/paginate', {
      query: { project_id: 'project-1', page: 2, items: 100 },
    });
    expect(ledgers.map((ledger) => ledger.id)).toEqual(['ledger-1', 'ledger-2']);
  });

  it('prioriza reasons canônicos e mantém compatibilidade legada', () => {
    const base = {
      id: 'ledger-1',
      amount: 'R$ 10,00',
      amount_cents: 1000,
      created_at: '2026-07-30T00:00:00Z',
      updated_at: '2026-07-30T00:00:00Z',
    };

    expect(ledgerToTransacao({ ...base, reason: 'despesa' }).tipo).toBe('despesa');
    expect(ledgerToTransacao({ ...base, reason: 'Pagamento fornecedor' }).tipo).toBe('despesa');
    expect(ledgerToTransacao({ ...base, reason: 'receita' }).tipo).toBe('receita');
  });
});
