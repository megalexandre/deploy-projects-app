import type { Projeto, Servico } from '@/types';
import type { TransacaoFinanceira } from '../services/financeiroService';

export type OpenReceivableRow = {
  key: string;
  entityId: string;
  displayId: string;
  name: string;
  integratorKey: string;
  integratorName: string;
  linkKind: 'Projeto' | 'Serviço';
  linkPath: string;
  value: number;
  paid: number;
  balance: number;
};

const OPEN_BALANCE_THRESHOLD = 0.01;

const asMoney = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const projectDisplayId = (project: Projeto) => {
  if (project.sequence) {
    return project.subsequente
      ? `${project.sequence}/${project.subsequente}`
      : String(project.sequence);
  }
  return project.protocolo || project.id;
};

const serviceDisplayId = (service: Servico) =>
  service.subsequencia
    ? `${service.protocolo}/${service.subsequencia}`
    : service.protocolo || service.id;

export const buildOpenReceivables = (
  projects: Projeto[],
  services: Servico[],
  transactions: TransacaoFinanceira[],
  users: Array<{ id: string; name: string; email: string }> = [],
): OpenReceivableRow[] => {
  const userNames = new Map(
    users.map((user) => [user.id, user.name.trim() || user.email || user.id]),
  );
  const paidByProject = new Map<string, number>();
  const paidByService = new Map<string, number>();

  transactions
    .filter((transaction) => transaction.tipo === 'receita')
    .forEach((transaction) => {
      if (transaction.projectId) {
        paidByProject.set(
          transaction.projectId,
          (paidByProject.get(transaction.projectId) ?? 0) + transaction.valor,
        );
      }
      if (transaction.serviceId) {
        paidByService.set(
          transaction.serviceId,
          (paidByService.get(transaction.serviceId) ?? 0) + transaction.valor,
        );
      }
    });

  const projectRows = projects.map((project): OpenReceivableRow => {
    const value = asMoney(project.valor);
    const paid = paidByProject.get(project.id) ?? 0;
    const integratorId = project.dadosProjeto.integradorId || project.dadosProjeto.integrador;
    const integratorName =
      userNames.get(integratorId) || project.dadosProjeto.integrador || 'Sem integrador';

    return {
      key: `project-${project.id}`,
      entityId: project.id,
      displayId: projectDisplayId(project),
      name: project.cliente.nome || 'Projeto sem nome',
      integratorKey: integratorId || 'sem-integrador',
      integratorName,
      linkKind: 'Projeto',
      linkPath: `/projetos/${project.id}`,
      value,
      paid,
      balance: value - paid,
    };
  });

  const serviceRows = services.map((service): OpenReceivableRow => {
    const value = asMoney(service.valorFinal ?? service.valor);
    const paid = paidByService.get(service.id) ?? 0;
    const integratorId = service.integradorId || service.createdBy || '';
    const integratorName =
      service.integradorNome || userNames.get(integratorId) || 'Sem integrador';

    return {
      key: `service-${service.id}`,
      entityId: service.id,
      displayId: serviceDisplayId(service),
      name: service.cliente || service.nome || 'Serviço sem nome',
      integratorKey: integratorId || integratorName || 'sem-integrador',
      integratorName,
      linkKind: 'Serviço',
      linkPath: `/servicos/${service.id}`,
      value,
      paid,
      balance: value - paid,
    };
  });

  return [...projectRows, ...serviceRows]
    .filter((row) => row.balance > OPEN_BALANCE_THRESHOLD)
    .sort(
      (left, right) =>
        left.integratorName.localeCompare(right.integratorName, 'pt-BR') ||
        left.name.localeCompare(right.name, 'pt-BR'),
    );
};
