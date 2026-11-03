import { describe, expect, it } from 'vitest';
import { Concessionaire } from '@/features/concessionaries/domain/concessionaire';
import type { Servico } from '@/types';
import { enrichServicosKanban } from './useServicosKanban';

const makeServico = (overrides: Partial<Servico> = {}): Servico =>
  ({
    id: 'servico-1',
    protocolo: 'SRV-001',
    tipo: 'ligacao_nova',
    nome: 'Ligação nova',
    cliente: 'Cliente Teste',
    concessionaria: 'Cemig',
    status: 'aguardando_aprovacao',
    dataAbertura: '2026-10-20',
    valor: 1_000,
    cupomDescontoPct: 0,
    valorFinal: 1_000,
    documentos: [],
    timeline: [],
    dataCriacao: '2026-10-20T10:00:00.000Z',
    dataAtualizacao: '2026-10-20T10:00:00.000Z',
    ...overrides,
  }) as Servico;

const concessionaria = new Concessionaire({
  id: 'concessionaria-1',
  name: 'CEMIG',
  acronym: 'CEMIG',
  code: 'cemig',
  region: 'MG',
  phone: '',
  email: '',
  active: true,
  logo: 'https://example.com/cemig.png',
});

describe('enrichServicosKanban', () => {
  it('adiciona a logo da concessionária e o nome do integrador responsável', () => {
    const [result] = enrichServicosKanban(
      [
        makeServico({
          concessionariaId: concessionaria.id,
          createdBy: 'integrador-1',
        }),
      ],
      [concessionaria],
      [{ id: 'integrador-1', name: 'Integrador Teste' }],
      null,
    );

    expect(result.concessionariaLogo).toBe('https://example.com/cemig.png');
    expect(result.integradorNome).toBe('Integrador Teste');
  });

  it('localiza a concessionária pelo nome e usa o usuário da sessão como fallback', () => {
    const [result] = enrichServicosKanban(
      [makeServico({ concessionariaId: 'id-desatualizado', createdBy: 'integrador-2' })],
      [concessionaria],
      [],
      { id: 'integrador-2', name: 'Integrador da Sessão' },
    );

    expect(result.concessionariaLogo).toBe('https://example.com/cemig.png');
    expect(result.integradorNome).toBe('Integrador da Sessão');
  });
});
