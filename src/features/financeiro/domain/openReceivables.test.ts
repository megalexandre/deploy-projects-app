import { describe, expect, it } from 'vitest';
import type { Projeto, Servico } from '@/types';
import type { TransacaoFinanceira } from '../services/financeiroService';
import { buildOpenReceivables } from './openReceivables';

const project = {
  id: 'project-1',
  protocolo: 'P-1',
  sequence: 10,
  subsequente: '',
  valor: 1_000,
  cliente: { nome: 'Cliente Projeto' },
  dadosProjeto: { integradorId: 'user-1', integrador: 'Integrador Antigo' },
} as Projeto;

const service = {
  id: 'service-1',
  protocolo: 'S-1',
  valor: 500,
  valorFinal: 450,
  cliente: 'Cliente Serviço',
  nome: 'Ligação nova',
  integradorId: 'user-2',
} as Servico;

const receipt = (id: string, value: number, link: { projectId?: string; serviceId?: string }) =>
  ({
    id,
    tipo: 'receita',
    valor: value,
    projectId: link.projectId,
    serviceId: link.serviceId,
  }) as TransacaoFinanceira;

describe('buildOpenReceivables', () => {
  it('calcula valor pago e saldo de projetos e serviços com todas as entradas vinculadas', () => {
    const rows = buildOpenReceivables(
      [project],
      [service],
      [receipt('r1', 250, { projectId: project.id }), receipt('r2', 50, { serviceId: service.id })],
      [
        { id: 'user-1', name: 'Integrador Um', email: 'um@opj.com' },
        { id: 'user-2', name: 'Integrador Dois', email: 'dois@opj.com' },
      ],
    );

    expect(rows.find((row) => row.entityId === project.id)).toMatchObject({
      displayId: '10',
      integratorName: 'Integrador Um',
      value: 1_000,
      paid: 250,
      balance: 750,
    });
    expect(rows.find((row) => row.entityId === service.id)).toMatchObject({
      integratorName: 'Integrador Dois',
      value: 450,
      paid: 50,
      balance: 400,
    });
  });

  it('remove itens cujo saldo é igual ou inferior a R$ 0,01', () => {
    const rows = buildOpenReceivables(
      [project],
      [service],
      [
        receipt('r1', 999.99, { projectId: project.id }),
        receipt('r2', 450, { serviceId: service.id }),
      ],
    );

    expect(rows).toEqual([]);
  });
});
