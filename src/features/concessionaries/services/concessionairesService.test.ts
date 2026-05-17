import { apiClient } from '@/shared/api/apiClient';
import { ENDPOINTS } from '@/shared/config/endpoints';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Concessionaire, type ConcessionaireData } from '../domain/concessionaire';
import { concessionairesService } from './concessionairesService';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

const makeData = (overrides: Partial<ConcessionaireData> = {}): ConcessionaireData => ({
  id: '1',
  name: 'Enel',
  acronym: 'EN',
  code: 'C01',
  region: 'Sul',
  phone: '11999990000',
  email: 'contato@enel.com',
  active: true,
  logo: null,
  ...overrides,
});

const makeInput = (overrides: Partial<Omit<ConcessionaireData, 'id'>> = {}): Omit<ConcessionaireData, 'id'> => ({
  name: 'Enel',
  acronym: 'EN',
  code: 'C01',
  region: 'Sul',
  phone: '11999990000',
  email: 'contato@enel.com',
  active: true,
  logo: null,
  ...overrides,
});

describe('concessionairesService', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
  });

  describe('getAll', () => {
    it('chama apiClient.get com o endpoint correto', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]);
      await concessionairesService.getAll();
      expect(apiClient.get).toHaveBeenCalledWith(ENDPOINTS.concessionaires);
    });

    it('retorna instâncias de Concessionaire', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([makeData(), makeData({ id: '2', name: 'CPFL' })]);
      const result = await concessionairesService.getAll();
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Concessionaire);
      expect(result[1]).toBeInstanceOf(Concessionaire);
    });

    it('retorna array vazio quando API retorna vazio', async () => {
      vi.mocked(apiClient.get).mockResolvedValueOnce([]);
      const result = await concessionairesService.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('chama apiClient.post com o endpoint e payload corretos', async () => {
      const input = makeInput();
      vi.mocked(apiClient.post).mockResolvedValueOnce(makeData());
      await concessionairesService.create(input);
      expect(apiClient.post).toHaveBeenCalledWith(ENDPOINTS.concessionaires, input);
    });

    it('retorna instância de Concessionaire', async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce(makeData());
      const result = await concessionairesService.create(makeInput());
      expect(result).toBeInstanceOf(Concessionaire);
      expect(result.name).toBe('Enel');
    });
  });

  describe('update', () => {
    it('chama apiClient.put com a URL contendo o id', async () => {
      const input = makeInput();
      vi.mocked(apiClient.put).mockResolvedValueOnce(makeData());
      await concessionairesService.update('1', input);
      expect(apiClient.put).toHaveBeenCalledWith(`${ENDPOINTS.concessionaires}/1`, input);
    });

    it('não inclui id no body da requisição', async () => {
      const input = makeInput();
      vi.mocked(apiClient.put).mockResolvedValueOnce(makeData());
      await concessionairesService.update('1', input);
      const [, body] = vi.mocked(apiClient.put).mock.calls[0];
      expect(body).not.toHaveProperty('id');
    });

    it('retorna instância de Concessionaire atualizada', async () => {
      vi.mocked(apiClient.put).mockResolvedValueOnce(makeData({ name: 'Enel Atualizada' }));
      const result = await concessionairesService.update('1', makeInput());
      expect(result).toBeInstanceOf(Concessionaire);
      expect(result.name).toBe('Enel Atualizada');
    });
  });
});
