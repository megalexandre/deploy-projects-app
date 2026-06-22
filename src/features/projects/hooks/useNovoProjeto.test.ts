import { describe, expect, it } from 'vitest';
import { StatusProjeto } from '@/core/entities/projeto';
import { getInitialProjectStatus, mapProjectServiceToServiceType } from './useNovoProjeto';

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

describe('mapProjectServiceToServiceType', () => {
  it('mapeia servicos marcados no projeto para tipos do modulo de servicos', () => {
    expect(mapProjectServiceToServiceType('Ligacao Nova')).toBe('ligacao_nova');
    expect(mapProjectServiceToServiceType('Aumento de Carga')).toBe('aumento_carga');
    expect(mapProjectServiceToServiceType('Troca de Titularidade')).toBe('troca_titularidade');
    expect(mapProjectServiceToServiceType('Alteracao no Compartilhamento de Creditos')).toBe(
      'alteracao_compartilhamento_credito',
    );
  });

  it('ignora servicos que ainda nao existem no modulo de servicos', () => {
    expect(mapProjectServiceToServiceType('Projeto Eletrico')).toBeNull();
  });
});
