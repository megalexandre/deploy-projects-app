import type { Projeto, StatusProjeto } from '@/types';
import { asString } from '@/core/utils/normalize';
import { createRecordStorage } from '@/core/utils/storage';
import {
  applyDerivedDadosTecnicos,
  getTimelineStatusFromProjectStatus,
  projectStatusFlow,
  toProjetoStatus,
} from './projectNormalizer';

// @TODO: achoq ue da pra remover essa classe toda

type FrontendProjectEnhancement = Partial<
  Pick<
    Projeto,
    | 'modulos'
    | 'inversores'
    | 'divisaoCreditos'
    | 'documentos'
    | 'coordenadas'
    | 'latitude'
    | 'longitude'
    | 'tensaoFornecimento'
    | 'padraoEntradaItens'
    | 'tipoProjeto'
    | 'servicos'
    | 'numeroUc'
    | 'dataAbertura'
    | 'projetoFastTrack'
    | 'projetoNovo'
    | 'zeroGridControleExportacao'
    | 'observacoes'
    | 'timeline'
    | 'status'
  >
>;

const projectEnhancementsStorage = createRecordStorage<FrontendProjectEnhancement>(
  'opj_frontend_project_enhancements',
);

export const updateProjectEnhancement = (
  projectId: string,
  updater: (current: FrontendProjectEnhancement | undefined) => FrontendProjectEnhancement,
) => {
  const current = projectEnhancementsStorage.read();
  current[projectId] = updater(current[projectId]);
  projectEnhancementsStorage.write(current);
};

export const saveProjectEnhancement = (
  projectId: string,
  enhancement: FrontendProjectEnhancement,
) => updateProjectEnhancement(projectId, (current) => ({ ...current, ...enhancement }));

export const hasAddressData = (endereco?: Projeto['endereco']): boolean => {
  if (!endereco) return false;
  return [
    endereco.cep,
    endereco.logradouro,
    endereco.numero,
    endereco.complemento,
    endereco.bairro,
    endereco.cidade,
    endereco.estado,
    endereco.link,
  ].some((item) => String(item ?? '').trim() !== '');
};

export const buildTimelineForProjectStatus = (
  project: Projeto,
  status: StatusProjeto,
  descricaoAtual?: string,
): Projeto['timeline'] =>
  projectStatusFlow.map((item, index) => ({
    id: `${project.id}-timeline-${item.status}`,
    etapa: item.etapa,
    data: index === 0 ? project.dataAbertura || project.dataCriacao : new Date().toISOString(),
    status: getTimelineStatusFromProjectStatus(item.status, status),
    descricao:
      item.status === status
        ? descricaoAtual || `Status atual do projeto ${project.protocolo}.`
        : item.status === 'aguardando_aprovacao'
          ? 'Projeto aguardando validacao administrativa antes de entrar no fluxo operacional.'
          : 'Etapa prevista no fluxo padrao do projeto.',
  }));

export const mergeProjectEnhancement = (project: Projeto): Projeto => {
  const enhancement = projectEnhancementsStorage.read()[project.id];
  if (!enhancement) return project;

  const modulos = enhancement.modulos ?? [];
  const inversores = enhancement.inversores ?? [];
  const divisaoCreditos = enhancement.divisaoCreditos ?? [];
  const documentos = enhancement.documentos ?? [];
  const padraoEntradaItens = enhancement.padraoEntradaItens ?? [];
  const servicos = enhancement.servicos ?? [];
  const timeline = enhancement.timeline ?? [];

  return applyDerivedDadosTecnicos({
    ...project,
    modulos: modulos.length > 0 ? modulos : project.modulos,
    inversores: inversores.length > 0 ? inversores : project.inversores,
    divisaoCreditos: divisaoCreditos.length > 0 ? divisaoCreditos : project.divisaoCreditos,
    documentos: documentos.length > 0 ? documentos : project.documentos,
    coordenadas: enhancement.coordenadas || project.coordenadas,
    latitude: enhancement.latitude || project.latitude,
    longitude: enhancement.longitude || project.longitude,
    tensaoFornecimento: enhancement.tensaoFornecimento || project.tensaoFornecimento,
    tipoProjeto: enhancement.tipoProjeto || project.tipoProjeto,
    servicos: servicos.length > 0 ? servicos : project.servicos,
    numeroUc: enhancement.numeroUc || project.numeroUc,
    dataAbertura: enhancement.dataAbertura || project.dataAbertura,
    projetoFastTrack: enhancement.projetoFastTrack || project.projetoFastTrack,
    projetoNovo: enhancement.projetoNovo || project.projetoNovo,
    zeroGridControleExportacao:
      enhancement.zeroGridControleExportacao || project.zeroGridControleExportacao,
    observacoes: enhancement.observacoes || project.observacoes,
    status: project.status,
    timeline: timeline.length > 0 ? timeline : project.timeline,
    padraoEntradaItens:
      padraoEntradaItens.length > 0 ? padraoEntradaItens : project.padraoEntradaItens,
    dadosTecnicos: {
      ...project.dadosTecnicos,
      modulos: modulos.length > 0 ? modulos : project.dadosTecnicos.modulos,
      inversores: inversores.length > 0 ? inversores : project.dadosTecnicos.inversores,
      divisaoCreditos:
        divisaoCreditos.length > 0 ? divisaoCreditos : project.dadosTecnicos.divisaoCreditos,
    },
  });
};

export const buildInitialTimeline = (projectData: {
  status?: string;
  utilityProtocol: string;
  dataAbertura?: string;
}): Projeto['timeline'] => {
  const currentStatus = toProjetoStatus(projectData.status);
  const protocol = asString(projectData.utilityProtocol) || 'novo projeto';
  return projectStatusFlow.map((item, index) => ({
    id: crypto.randomUUID(),
    etapa: item.etapa,
    data:
      index === 0 ? projectData.dataAbertura || new Date().toISOString() : new Date().toISOString(),
    status: getTimelineStatusFromProjectStatus(item.status, currentStatus),
    descricao:
      item.status === currentStatus
        ? `Projeto ${protocol} criado no frontend e pronto para receber historico oficial do backend.`
        : item.status === 'em_analise_documentacao'
          ? 'Projeto aberto e aguardando evolucao das proximas etapas.'
          : 'Etapa prevista no fluxo padrao do projeto.',
  }));
};
