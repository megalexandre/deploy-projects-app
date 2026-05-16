import type { Projeto } from '@/types';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useIdentifier } from './useIdentifyer';

vi.mock('@/shared/hooks/useCurrentUser');

const mockProject = {
  id: '1',
  protocolo: 'PROJ-001',
  sequence: 42,
  subsequente: 'B',
} as unknown as Projeto;

const mockProjectWithoutSubsequente = {
  id: '1',
  protocolo: 'PROJ-001',
  sequence: 42,
  subsequente: '',
} as unknown as Projeto;


describe('useIdentifier', () => {

  describe("quando o usuário É ADMIN", () => {
    
    it('retorna sequence/subsequente', () => {
      const { result } = renderHook(() => useIdentifier({project: mockProject, isAdmin: true}));
      expect(result.current).toBe('42/B');
    });

    it('retorna sequence', () => {
      const { result } = renderHook(() => useIdentifier({project: mockProjectWithoutSubsequente, isAdmin: true}));
      expect(result.current).toBe('42');
    });

  });

  describe("quando o usuário NÃO É ADMIN", () => {
    it('retorna o protocolo quando usuário não é admin', () => {
      const { result } = renderHook(() => useIdentifier({project: mockProject, isAdmin: false}));
      expect(result.current).toBe('PROJ-001');
    });

  });

});
