import type { Projeto, StatusProjeto } from '@/types';
import { asString } from '@/core/utils/normalize';
import { createRecordStorage } from '@/core/utils/storage';
import { applyDerivedDadosTecnicos, projectStatusFlow, toProjetoStatus } from './projectNormalizer';

// @TODO: achoq ue da pra remover essa classe toda

type FrontendProjectEnhancement = Partial<
  Pick<
    Projeto,
    | 'modulos'
    | 'inversores'
    | 'divisaoCreditos'
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

const getTimelineStageLabel = (status: StatusProjeto) =>
  projectStatusFlow.find((item) => item.status === status)?.etapa ?? status;

const getRecordedTimelineStatus = (status: StatusProjeto): Projeto['timeline'][number]['status'] =>
  status === 'projeto_aprovado' || status === 'projeto_encerrado' ? 'concluido' : 'em_andamento';

export const buildTimelineEntry = (
  project: Pick<Projeto, 'id' | 'protocolo' | 'dataAbertura' | 'dataCriacao'>,
  status: StatusProjeto,
  descricaoAtual?: string,
  data?: string,
): Projeto['timeline'][number] => ({
  id: crypto.randomUUID(),
  etapa: getTimelineStageLabel(status),
  data: data || new Date().toISOString(),
  status: getRecordedTimelineStatus(status),
  descricao: descricaoAtual || `Status atual do projeto ${project.protocolo}.`,
  comentarios: [],
});

export const appendTimelineEntryForProjectStatus = (
  project: Pick<Projeto, 'id' | 'protocolo' | 'dataAbertura' | 'dataCriacao'>,
  currentTimeline: Projeto['timeline'],
  status: StatusProjeto,
  descricaoAtual?: string,
): Projeto['timeline'] => {
  const previousTimeline = currentTimeline.map((item, index, array) =>
    index === array.length - 1 && item.status === 'em_andamento'
      ? { ...item, status: 'concluido' as const }
      : item,
  );

  return [...previousTimeline, buildTimelineEntry(project, status, descricaoAtual)];
};

export const mergeProjectEnhancement = (project: Projeto): Projeto => {
  const enhancement = projectEnhancementsStorage.read()[project.id];
  if (!enhancement) return project;

  const modulos = enhancement.modulos ?? [];
  const inversores = enhancement.inversores ?? [];
  const divisaoCreditos = enhancement.divisaoCreditos ?? [];
  const padraoEntradaItens = enhancement.padraoEntradaItens ?? [];
  const servicos = enhancement.servicos ?? [];

  return applyDerivedDadosTecnicos({
    ...project,
    modulos: modulos.length > 0 ? modulos : project.modulos,
    inversores: inversores.length > 0 ? inversores : project.inversores,
    divisaoCreditos: divisaoCreditos.length > 0 ? divisaoCreditos : project.divisaoCreditos,
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
  id?: string;
}): Projeto['timeline'] => {
  const currentStatus = toProjetoStatus(projectData.status);
  const protocol = asString(projectData.utilityProtocol) || 'novo projeto';
  return [
    buildTimelineEntry(
      {
        id: projectData.id || crypto.randomUUID(),
        protocolo: protocol,
        dataAbertura: projectData.dataAbertura,
        dataCriacao: new Date().toISOString(),
      },
      currentStatus,
      `Projeto ${protocol} criado no frontend e pronto para receber historico oficial do backend.`,
      projectData.dataAbertura || new Date().toISOString(),
    ),
  ];
};
