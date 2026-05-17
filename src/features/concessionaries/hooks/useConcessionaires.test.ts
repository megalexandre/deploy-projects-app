import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Concessionaire } from '../domain/concessionaire';
import { useConcessionaires } from './useConcessionaires';

vi.mock('../services/concessionairesService', () => ({
  concessionairesService: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

import { concessionairesService } from '../services/concessionairesService';

const makeConcessionaire = (overrides: Partial<Concessionaire> = {}): Concessionaire =>
  new Concessionaire({
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

describe('useConcessionaires', () => {
  beforeEach(() => {
    vi.mocked(concessionairesService.getAll).mockReset();
    vi.mocked(concessionairesService.create).mockReset();
    vi.mocked(concessionairesService.update).mockReset();
  });

  describe('carregamento inicial', () => {
    it('loading começa true e vira false após carga', async () => {
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([]);
      const { result } = renderHook(() => useConcessionaires());

      expect(result.current.loading).toBe(true);
      await waitFor(() => expect(result.current.loading).toBe(false));
    });

    it('preenche items após getAll com sucesso', async () => {
      const items = [makeConcessionaire(), makeConcessionaire({ id: '2', name: 'CPFL' })];
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce(items);

      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.filteredItems).toHaveLength(2);
    });

    it('define error quando getAll rejeita', async () => {
      vi.mocked(concessionairesService.getAll).mockRejectedValueOnce(new Error('falha'));

      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('filteredItems', () => {
    beforeEach(() => {
      vi.mocked(concessionairesService.getAll).mockResolvedValue([
        makeConcessionaire({ id: '1', name: 'Enel', acronym: 'EN', code: 'C01' }),
        makeConcessionaire({ id: '2', name: 'CPFL', acronym: 'CP', code: 'C02' }),
        makeConcessionaire({ id: '3', name: 'Cemig', acronym: 'CM', code: 'C03' }),
      ]);
    });

    it('retorna todos quando searchTerm está vazio', async () => {
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.filteredItems).toHaveLength(3);
    });

    it('filtra por nome', async () => {
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setSearchTerm('enel'));
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe('Enel');
    });

    it('filtra por sigla', async () => {
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setSearchTerm('CP'));
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe('CPFL');
    });

    it('filtra por código', async () => {
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setSearchTerm('C03'));
      expect(result.current.filteredItems).toHaveLength(1);
      expect(result.current.filteredItems[0].name).toBe('Cemig');
    });

    it('ordena por nome em locale pt-BR', async () => {
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const names = result.current.filteredItems.map((i) => i.name);
      expect(names).toEqual(['Cemig', 'CPFL', 'Enel']);
    });
  });

  describe('setField', () => {
    it('atualiza apenas o campo indicado no form', async () => {
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([]);
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setField('name', 'Nova'));

      expect(result.current.form.name).toBe('Nova');
      expect(result.current.form.acronym).toBe('');
    });
  });

  describe('handleEdit e handleCancelEdit', () => {
    it('handleEdit define editingId e preenche o form', async () => {
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([]);
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      const item = makeConcessionaire({ id: '42', name: 'Enel', acronym: 'EN' });
      act(() => result.current.handleEdit(item));

      expect(result.current.editingId).toBe('42');
      expect(result.current.form.name).toBe('Enel');
      expect(result.current.form.acronym).toBe('EN');
    });

    it('handleCancelEdit zera editingId e reseta o form', async () => {
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([]);
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleEdit(makeConcessionaire({ id: '42' })));
      act(() => result.current.handleCancelEdit());

      expect(result.current.editingId).toBeNull();
      expect(result.current.form.name).toBe('');
    });
  });

  describe('handleSubmit', () => {
    const fakeEvent = { preventDefault: vi.fn() } as unknown as React.FormEvent;

    it('define error e não chama service quando nome é inválido', async () => {
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([]);
      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setField('name', 'a'));
      await act(() => result.current.handleSubmit(fakeEvent));

      expect(result.current.error).toBeTruthy();
      expect(concessionairesService.create).not.toHaveBeenCalled();
    });

    it('chama create quando editingId é null e adiciona item ao estado', async () => {
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([]);
      const created = makeConcessionaire({ id: '99', name: 'Nova' });
      vi.mocked(concessionairesService.create).mockResolvedValueOnce(created);

      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.setField('name', 'Nova'));
      await act(() => result.current.handleSubmit(fakeEvent));

      expect(concessionairesService.create).toHaveBeenCalledOnce();
      expect(result.current.filteredItems.some((i) => i.id === '99')).toBe(true);
      expect(result.current.editingId).toBeNull();
      expect(result.current.form.name).toBe('');
    });

    it('chama update quando editingId está definido e substitui item no estado', async () => {
      const existing = makeConcessionaire({ id: '1', name: 'Enel' });
      vi.mocked(concessionairesService.getAll).mockResolvedValueOnce([existing]);
      const updated = makeConcessionaire({ id: '1', name: 'Enel Atualizada' });
      vi.mocked(concessionairesService.update).mockResolvedValueOnce(updated);

      const { result } = renderHook(() => useConcessionaires());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.handleEdit(existing));
      act(() => result.current.setField('name', 'Enel Atualizada'));
      await act(() => result.current.handleSubmit(fakeEvent));

      expect(concessionairesService.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ name: 'Enel Atualizada' }),
      );
      expect(result.current.filteredItems[0].name).toBe('Enel Atualizada');
      expect(result.current.editingId).toBeNull();
    });
  });
});
