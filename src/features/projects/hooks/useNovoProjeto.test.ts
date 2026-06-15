import { describe, expect, it } from 'vitest';
import { StatusProjeto } from '@/core/entities/projeto';
import { getInitialProjectStatus } from './useNovoProjeto';

describe('getInitialProjectStatus', () => {
  it('envia projeto criado por usuario comum para aprovacao', () => {
    expect(getInitialProjectStatus(false, false)).toBe(StatusProjeto.AGUARDANDO_APROVACAO);
  });

  it('inicia projeto criado por admin no fluxo operacional', () => {
    expect(getInitialProjectStatus(false, true)).toBe(StatusProjeto.EM_ANALISE_DOCUMENTACAO);
  });

  it('nao altera status durante edicao', () => {
    expect(getInitialProjectStatus(true, false)).toBeUndefined();
    expect(getInitialProjectStatus(true, true)).toBeUndefined();
  });
});
