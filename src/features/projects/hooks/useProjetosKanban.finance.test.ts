import { describe, expect, it } from 'vitest';
import { calculateExpectedProjectRevenue } from './useProjetosKanban';

describe('calculateExpectedProjectRevenue', () => {
  const projects = [
    { id: 'project-1', valor: 1_000 },
    { id: 'project-2', valor: 500 },
  ];

  it('soma apenas o saldo ainda nao recebido dos projetos', () => {
    expect(
      calculateExpectedProjectRevenue(projects, [
        { tipo: 'receita', valor: 250, projectId: 'project-1' },
        { tipo: 'despesa', valor: 100, projectId: 'project-1' },
        { tipo: 'receita', valor: 500, projectId: 'project-2' },
      ]),
    ).toBe(750);
  });

  it('nunca gera receita prevista negativa quando ha pagamento excedente', () => {
    expect(
      calculateExpectedProjectRevenue(projects, [
        { tipo: 'receita', valor: 1_200, projectId: 'project-1' },
      ]),
    ).toBe(500);
  });
});
