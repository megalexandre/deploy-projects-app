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
    vi.mocked(apiClient.post).mockResolvedValue(undefined);
    vi.mocked(apiClient.patch).mockResolvedValue(undefined);
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);
  });

  it('pagina lançamentos filtrados usando limit e project_id', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(page(0, 2, ['ledger-1']))
      .mockResolvedValueOnce(page(1, 2, ['ledger-2']));

    const ledgers = await financeiroService.listFilteredLedgers({ project_id: 'project-1' });

    expect(apiClient.get).toHaveBeenNthCalledWith(1, '/ledgers/paginate', {
      query: { project_id: 'project-1', page: 1, limit: 100 },
    });
    expect(apiClient.get).toHaveBeenNthCalledWith(2, '/ledgers/paginate', {
      query: { project_id: 'project-1', page: 2, limit: 100 },
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

  it('usa o mesmo conjunto paginado no financeiro geral e nas abas vinculadas', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(page(0, 2, ['a']))
      .mockResolvedValueOnce(page(1, 2, ['b']));
    expect((await financeiroService.listTransacoes()).map((item) => item.id)).toEqual(['a', 'b']);
    expect(apiClient.get).not.toHaveBeenCalledWith('/ledgers', expect.anything());
  });

  it('arredonda valores em centavos antes de salvar e preserva os vínculos enviados', async () => {
    await financeiroService.createLedger({
      project_id: 'project-1',
      amount: 100.005,
      reason: 'receita',
      description: 'Recebimento',
    });
    expect(apiClient.post).toHaveBeenCalledWith(
      '/ledgers',
      expect.objectContaining({ project_id: 'project-1', amount: 100.01 }),
    );
    await financeiroService.updateLedger('entry', { amount: 10.004 });
    expect(apiClient.patch).toHaveBeenCalledWith('/ledgers/entry', { amount: 10 });
  });

  it('traduz a recusa de permissão do backend sem depender de autoria no JSON', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce({ status: 403 });
    await expect(financeiroService.updateLedger('entry', { amount: 10 })).rejects.toThrow(
      'Você só pode editar ou excluir lançamentos criados por você.',
    );
    vi.mocked(apiClient.delete).mockRejectedValueOnce({ status: 403 });
    await expect(financeiroService.removeLedger('entry')).rejects.toThrow(
      'Você só pode editar ou excluir lançamentos criados por você.',
    );
  });

  it('preserva erros de comunicação e remove quando a API autoriza', async () => {
    vi.mocked(apiClient.patch).mockRejectedValueOnce(new Error('Falha de conexão'));
    await expect(financeiroService.updateLedger('entry', { amount: 10 })).rejects.toThrow(
      'Falha de conexão',
    );
    await financeiroService.removeLedger('entry');
    expect(apiClient.delete).toHaveBeenCalledWith('/ledgers/entry');
  });
});
