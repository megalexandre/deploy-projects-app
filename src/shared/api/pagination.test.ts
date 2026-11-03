import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { getAllPages } from './pagination';

vi.mock('./apiClient', () => ({ apiClient: { get: vi.fn() } }));

describe('getAllPages', () => {
  beforeEach(() => vi.clearAllMocks());
  it('reúne todas as páginas para manter busca e contadores globais', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ content: [{ id: 'a' }], totalPages: 3 })
      .mockResolvedValueOnce({ content: [{ id: 'b' }], totalPages: 3 })
      .mockResolvedValueOnce({ content: [{ id: 'c' }], totalPages: 3 });
    expect(await getAllPages('/services')).toEqual([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(apiClient.get).toHaveBeenNthCalledWith(3, '/services/paginate', {
      query: { page: 3, limit: 100 },
    });
  });
  it('não retorna uma lista parcial se uma página falhar', async () => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce({ content: [{ id: 'a' }], totalPages: 2 })
      .mockRejectedValueOnce(new Error('Falha ao carregar'));
    await expect(getAllPages('/customers')).rejects.toThrow('Falha ao carregar');
  });
  it('aceita lista vazia e rejeita contrato inválido', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({ content: [], totalPages: 0 });
    expect(await getAllPages('/customers')).toEqual([]);
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);
    await expect(getAllPages('/customers')).rejects.toThrow('Resposta de paginação inválida');
  });
});
