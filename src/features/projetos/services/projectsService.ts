/** Camada de acesso a dados para 'projectsService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Documento, PadraoEntradaItem, Projeto, DashboardStats, PaginatedResponse, StatusProjeto } from '@/types';
import { asArray, asBooleanString, asNumber, asString, isRecord } from '@/core/utils/normalize';
import { createRecordStorage } from '@/core/utils/storage';
import { apiClient } from '@/shared/api/apiClient';
import { approvalsService } from '@/features/aprovacoes/services/approvalsService';
import { customersService } from '@/features/clientes/services/customersService';

export type Project = Projeto;

export interface CreateProjectData {
  id?: string;
  clientId: string;
  addressId?: string;
  utilityCompany: string;
  utilityProtocol: string;
  customerClass: string;
  integrator: string;
  modality: string;
  framework: string;
  dcProtection?: string;
  systemPower?: number;
  status?: string;
  amount?: number;
  nomeCliente?: string;
  projectType?: string;
  servicesNames?: string[];
  unitControl?: string;
  enderecoCompleto?: string;
  dataAbertura?: string;
  coordinates?: Projeto['coordenadas'];
  latitude?: string;
  longitude?: string;
  tensaoFornecimento?: string;
  padraoEntradaItens?: PadraoEntradaItem[];
  modulos?: Projeto['modulos'];
  inversores?: Projeto['inversores'];
  documentos?: Documento[];
  fastTrack?: string;
  projetoNovo?: string;
  zeroGridControleExportacao?: string;
  description?: string;
  divisaoCreditos?: Projeto['divisaoCreditos'];
}

export interface UpdateProjectData {
  id?: string;
  clientId?: string;
  nomeCliente?: string;
  utilityCompany?: string;
  utilityProtocol?: string;
  customerClass?: string;
  integrator?: string;
  modality?: string;
  framework?: string;
  dcProtection?: string;
  systemPower?: number;
  amount?: number;
  status?: string;
  addressId?: string;
  coordinates?: Projeto['coordenadas'];
  servicesNames?: string[];
  projectType?: string;
  fastTrack?: string;
  unitControl?: string;
  description?: string;
}

export const projectStatusFlow: Array<{ status: StatusProjeto; etapa: string }> = [
  { status: 'aguardando_aprovacao', etapa: 'Aguardando Aprovacao' },
  { status: 'em_analise_documentacao', etapa: 'Em Analise da Documentacao' },
  { status: 'elaboracao_documentacao_tecnica', etapa: 'Elaboracao da Documentacao Tecnica' },
  { status: 'aguardando_assinatura_cliente', etapa: 'Aguardando Assinatura do Cliente' },
  { status: 'projeto_enviado_aguardando_protocolo_concessionaria', etapa: 'Projeto Enviado para Concessionaria' },
  { status: 'em_analise_concessionaria', etapa: 'Em Analise na Concessionaria' },
  { status: 'ressalvas_projetos', etapa: 'Ressalvas de Projeto' },
  { status: 'obras_concessionaria', etapa: 'Obras da Concessionaria' },
  { status: 'projeto_aprovado', etapa: 'Projeto Aprovado' },
  { status: 'vistoria_solicitada', etapa: 'Vistoria Solicitada' },
  { status: 'vistoria_reprovada', etapa: 'Vistoria Reprovada' },
  { status: 'aguardando_pagamento', etapa: 'Aguardando Pagamento' },
  { status: 'projeto_encerrado', etapa: 'Projeto Encerrado' }
];

type FrontendProjectEnhancement = Partial<Pick<
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
>>;

type TimelineStatus = Projeto['timeline'][number]['status'];

const projectEnhancementsStorage = createRecordStorage<FrontendProjectEnhancement>('opj_frontend_project_enhancements');

const asCoordinateObject = (value: unknown): Projeto['coordenadas'] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const latitude = asString(value.latitude);
  const longitude = asString(value.longitude);

  if (!latitude || !longitude) {
    return undefined;
  }

  return { latitude, longitude };
};

const deriveTensao = (tensaoAtual: number, tensaoFornecimento?: string) => {
  if (tensaoAtual > 0) {
    return tensaoAtual;
  }

  const normalized = asString(tensaoFornecimento);
  if (!normalized) {
    return 0;
  }

  const values = normalized
    .replace(/[^\d/]/g, '')
    .split('/')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);

  return values.length > 0 ? Math.max(...values) : 0;
};

const deriveNumeroFases = (numeroFasesAtual: number, padraoEntradaItens?: PadraoEntradaItem[], tensaoFornecimento?: string) => {
  if (numeroFasesAtual > 0) {
    return numeroFasesAtual;
  }

  const tipoLigacao = padraoEntradaItens?.find((item) => asString(item.tipoLigacao))?.tipoLigacao?.toLowerCase() ?? '';
  if (tipoLigacao.includes('trif')) {
    return 3;
  }

  if (tipoLigacao.includes('bif')) {
    return 2;
  }

  if (tipoLigacao.includes('mono')) {
    return 1;
  }

  const normalized = asString(tensaoFornecimento).toLowerCase();
  if (normalized.includes('380')) {
    return 3;
  }

  if (normalized.includes('220')) {
    return 2;
  }

  return 0;
};

const deriveRamal = (ramalAtual: string, padraoEntradaItens?: PadraoEntradaItem[], numeroFases?: number) => {
  if (ramalAtual.trim()) {
    return ramalAtual;
  }

  const tipoLigacao = padraoEntradaItens?.find((item) => asString(item.tipoLigacao))?.tipoLigacao?.trim();
  if (tipoLigacao) {
    return tipoLigacao;
  }

  if (numeroFases === 3) {
    return 'Trifasico';
  }

  if (numeroFases === 2) {
    return 'Bifasico';
  }

  if (numeroFases === 1) {
    return 'Monofasico';
  }

  return '';
};

const deriveDisjuntor = (disjuntorAtual: string, padraoEntradaItens?: PadraoEntradaItem[], protecaoCC?: string) => {
  if (disjuntorAtual.trim()) {
    return disjuntorAtual;
  }

  const padraoDisjuntor = padraoEntradaItens?.find((item) => asString(item.disjuntor))?.disjuntor?.trim();
  if (padraoDisjuntor) {
    return padraoDisjuntor;
  }

  return asString(protecaoCC);
};

const deriveCargaInstalada = (
  cargaInstaladaAtual: number,
  modulos: Projeto['modulos'],
  inversores: Projeto['inversores'],
  potenciaSistemaKw: number
) => {
  if (cargaInstaladaAtual > 0) {
    return cargaInstaladaAtual;
  }

  const cargaModulos = modulos.reduce((total, item) => total + (Number(item.quantidade) || 0) * (Number(item.potencia) || 0), 0);
  const cargaInversores = inversores.reduce((total, item) => total + (Number(item.quantidade) || 0) * (Number(item.potencia) || 0), 0);
  const cargaSistema = Math.round((Number(potenciaSistemaKw) || 0) * 1000);

  return Math.max(cargaModulos, cargaInversores, cargaSistema, 0);
};

const applyDerivedDadosTecnicos = (project: Projeto): Projeto => {
  const tensao = deriveTensao(project.dadosTecnicos.tensao, project.tensaoFornecimento);
  const numeroFases = deriveNumeroFases(project.dadosTecnicos.numeroFases, project.padraoEntradaItens, project.tensaoFornecimento);
  const ramal = deriveRamal(project.dadosTecnicos.ramal, project.padraoEntradaItens, numeroFases);
  const disjuntor = deriveDisjuntor(project.dadosTecnicos.disjuntor, project.padraoEntradaItens, project.dadosProjeto.protecaoCC);
  const cargaInstalada = deriveCargaInstalada(
    project.dadosTecnicos.cargaInstalada,
    project.dadosTecnicos.modulos,
    project.dadosTecnicos.inversores,
    project.dadosProjeto.potenciaSistema
  );

  return {
    ...project,
    dadosTecnicos: {
      ...project.dadosTecnicos,
      tensao,
      numeroFases,
      ramal,
      disjuntor,
      cargaInstalada
    }
  };
};

const saveProjectEnhancement = (projectId: string, enhancement: FrontendProjectEnhancement) =>
  updateProjectEnhancement(projectId, (current) => ({ ...current, ...enhancement }));

const updateProjectEnhancement = (
  projectId: string,
  updater: (current: FrontendProjectEnhancement | undefined) => FrontendProjectEnhancement
) => {
  const current = projectEnhancementsStorage.read();
  current[projectId] = updater(current[projectId]);
  projectEnhancementsStorage.write(current);
};

const hasAddressData = (endereco?: Projeto['endereco']): boolean => {
  if (!endereco) {
    return false;
  }

  return [endereco.cep, endereco.logradouro, endereco.numero, endereco.complemento, endereco.bairro, endereco.cidade, endereco.estado, endereco.link]
    .some((item) => String(item ?? '').trim() !== '');
};

const normalizeStatusKey = (rawStatus: unknown): string => {
  return asString(rawStatus)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
};

const STATUS_FLOW = projectStatusFlow;

const getTimelineStatusFromProjectStatus = (status: StatusProjeto, currentStatus: StatusProjeto): TimelineStatus => {
  const currentIndex = STATUS_FLOW.findIndex((item) => item.status === currentStatus);
  const itemIndex = STATUS_FLOW.findIndex((item) => item.status === status);

  if (itemIndex < 0 || currentIndex < 0) {
    return 'pendente';
  }

  if (itemIndex < currentIndex) {
    return 'concluido';
  }

  if (itemIndex === currentIndex) {
    return currentStatus === 'projeto_aprovado' || currentStatus === 'projeto_encerrado' ? 'concluido' : 'em_andamento';
  }

  return 'pendente';
};

const normalizeTimelineItem = (item: unknown): Projeto['timeline'][number] | null => {
  if (!isRecord(item)) {
    return null;
  }

  const etapa = asString(item.etapa) || asString(item.stage) || asString(item.title);
  if (!etapa) {
    return null;
  }

  const rawStatus = normalizeStatusKey(item.status);
  const status: TimelineStatus =
    rawStatus === 'concluido' ? 'concluido' : rawStatus === 'em_andamento' ? 'em_andamento' : 'pendente';

  return {
    id: asString(item.id) || crypto.randomUUID(),
    etapa,
    data: asString(item.data) || asString(item.date) || new Date().toISOString(),
    status,
    descricao: asString(item.descricao) || asString(item.description) || undefined
  };
};

const normalizeModalidade = (rawModalidade: unknown): Projeto['dadosProjeto']['modalidade'] => {
  const modalidade = normalizeStatusKey(rawModalidade);

  if (modalidade.includes('compart')) {
    return 'geracao_compartilhada';
  }

  if (modalidade.includes('remoto')) {
    return 'autoconsumo_remoto';
  }

  return 'autoconsumo_local';
};

const VALID_STATUSES = new Set<StatusProjeto>([
  'aguardando_aprovacao',
  'em_analise_documentacao', 'elaboracao_documentacao_tecnica', 'aguardando_assinatura_cliente',
  'projeto_enviado_aguardando_protocolo_concessionaria', 'em_analise_concessionaria',
  'ressalvas_projetos', 'obras_concessionaria', 'projeto_aprovado',
  'vistoria_solicitada', 'vistoria_reprovada', 'aguardando_pagamento', 'projeto_encerrado'
]);

const STATUS_ALIASES: Record<string, StatusProjeto> = {
  completed: 'projeto_encerrado', concluido: 'projeto_encerrado',
  cancelled: 'projeto_encerrado', cancelado: 'projeto_encerrado',
  active: 'em_analise_concessionaria', em_analise: 'em_analise_concessionaria',
  in_progress: 'em_analise_concessionaria', em_andamento: 'em_analise_concessionaria',
  novo: 'em_analise_documentacao', pending: 'em_analise_documentacao', pendente: 'em_analise_documentacao',
  approved: 'projeto_aprovado', aprovado: 'projeto_aprovado',
  installation: 'obras_concessionaria', instalacao: 'obras_concessionaria'
};

const toProjetoStatus = (rawStatus: unknown): StatusProjeto => {
  const status = normalizeStatusKey(rawStatus);
  if (VALID_STATUSES.has(status as StatusProjeto)) return status as StatusProjeto;
  return STATUS_ALIASES[status] ?? 'em_analise_documentacao';
};
const extractDataFromList = (response: unknown[] | PaginatedResponse<unknown>) => {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response.data) ? response.data : [];
};

const buildFallbackTimeline = (project: Pick<Projeto, 'id' | 'status' | 'dataAbertura' | 'dataCriacao' | 'dataAtualizacao' | 'dadosProjeto' | 'protocolo'>) =>
  STATUS_FLOW.map((item, index) => {
    const timelineStatus = getTimelineStatusFromProjectStatus(item.status, project.status);
    const isCurrent = item.status === project.status;
    const description =
      timelineStatus === 'pendente'
        ? `Etapa aguardando dados do backend para historico completo em ${project.dadosProjeto.concessionaria || 'concessionaria'}.`
        : isCurrent
          ? `Status atual do projeto ${project.protocolo}.`
          : 'Etapa concluida antes do status atual.';

    return {
      id: `${project.id}-timeline-${item.status}`,
      etapa: item.etapa,
      data: index === 0 ? project.dataAbertura || project.dataCriacao : project.dataAtualizacao,
      status: timelineStatus,
      descricao: description
    };
  });

const normalizeProjeto = (raw: unknown): Projeto => {
  // Este adapter protege a UI contra variacoes de nomenclatura do backend e payloads parciais.
  const project = isRecord(raw) ? raw : {};
  const cliente = isRecord(project.cliente) ? project.cliente : {};
  const customer = isRecord(project.customer) ? project.customer : {};
  const endereco =
    (isRecord(project.endereco) ? project.endereco : null) ||
    (isRecord(project.address) ? project.address : null) ||
    {};
  const dadosProjeto = isRecord(project.dadosProjeto) ? project.dadosProjeto : {};
  const financeiro = isRecord(project.financeiro) ? project.financeiro : {};
  const dadosTecnicos = isRecord(project.dadosTecnicos) ? project.dadosTecnicos : {};

  const id = asString(project.id) || crypto.randomUUID();
  const protocolo =
    asString(project.protocolo) ||
    asString(project.protocoloConcessionaria) ||
    `PROJ-${id.slice(0, 8).toUpperCase()}`;

  const projetoNormalizado: Projeto = {
    id,
    protocolo,
    cliente: {
      id:
        asString(cliente.id) ||
        asString(customer.id) ||
        asString(project.client_id) ||
        asString(project.clientId) ||
        asString(project.clienteId) ||
        asString(project.customerId) ||
        'sem-cliente',
      nome:
        asString(cliente.nome) ||
        asString(customer.nome) ||
        asString(customer.name) ||
        asString(project.nomeCliente) ||
        asString(project.clienteNome) ||
        asString(project.customerName) ||
        'Cliente sem nome',
      cpfCnpj:
        asString(cliente.cpfCnpj) ||
        asString(customer.cpfCnpj) ||
        asString(customer.tax_id) ||
        asString(customer.taxId) ||
        asString(project.cpfCnpj),
      telefone:
        asString(cliente.telefone) ||
        asString(customer.telefone) ||
        asString(customer.phone) ||
        asString(project.telefone),
      email: asString(cliente.email) || asString(customer.email) || asString(project.email)
    },
    endereco: {
      cep: asString(endereco.cep),
      logradouro: asString(endereco.logradouro) || asString(endereco.address) || asString(endereco.place) || asString(project.enderecoCompleto),
      numero: asString(endereco.numero) || asString(endereco.number),
      complemento: asString(endereco.complemento) || asString(endereco.complement),
      bairro: asString(endereco.bairro) || asString(endereco.neighborhood),
      cidade: asString(endereco.cidade) || asString(endereco.city),
      estado: asString(endereco.estado) || asString(endereco.state),
      link: asString(endereco.link) || undefined
    },
    dadosProjeto: {
      concessionaria:
        asString(dadosProjeto.concessionaria) ||
        asString(project.concessionaria) ||
        asString(project.utility_company) ||
        asString(project.utilityCompany),
      classe:
        asString(dadosProjeto.classe) ||
        asString(project.classe) ||
        asString(project.customer_class) ||
        asString(project.customerClass),
      integrador: asString(dadosProjeto.integrador) || asString(project.integrator),
      modalidade:
        normalizeModalidade(
          dadosProjeto.modalidade ??
          project.modalidade ??
          project.modality
        ),
      enquadramento:
        asString(dadosProjeto.enquadramento) ||
        asString(project.enquadramento) ||
        asString(project.framework),
      potenciaSistema:
        asNumber(
          dadosProjeto.potenciaSistema ??
          project.potenciaSistema ??
          project.system_power ??
          project.systemPower
        ),
      protecaoCC:
        asString(dadosProjeto.protecaoCC) ||
        asString(project.protecaoCC) ||
        asString(project.dc_protection) ||
        asString(project.dcProtection)
    },
    dadosTecnicos: {
      tensao: asNumber(dadosTecnicos.tensao),
      numeroFases: asNumber(dadosTecnicos.numeroFases),
      ramal: asString(dadosTecnicos.ramal),
      disjuntor: asString(dadosTecnicos.disjuntor),
      cargaInstalada: asNumber(dadosTecnicos.cargaInstalada),
      modulos: asArray<Projeto['modulos'][number]>(dadosTecnicos.modulos ?? project.modulos),
      inversores: asArray<Projeto['inversores'][number]>(dadosTecnicos.inversores ?? project.inversores),
      divisaoCreditos: asArray<Projeto['divisaoCreditos'][number]>(dadosTecnicos.divisaoCreditos ?? project.divisaoCreditos)
    },
    modulos: asArray<Projeto['modulos'][number]>(project.modulos),
    inversores: asArray<Projeto['inversores'][number]>(project.inversores),
    divisaoCreditos: asArray<Projeto['divisaoCreditos'][number]>(project.divisaoCreditos),
    timeline: asArray(project.timeline).map(normalizeTimelineItem).filter((item): item is Projeto['timeline'][number] => item !== null),
    documentos: asArray<Projeto['documentos'][number]>(project.documentos),
    status: toProjetoStatus(project.status ?? project.projectStatus ?? project.situacao ?? project.state),
    valor: asNumber(project.valor ?? project.amount ?? project.value ?? dadosProjeto.valor ?? financeiro.valor),
    tipoProjeto:
      asString(project.tipoProjeto) ||
      asString(project.tipo_projeto) ||
      asString(project.project_type) ||
      asString(project.projectType) ||
      undefined,
    servicos: asArray<string>(project.servicos ?? project.services_names ?? project.servicesNames),
    numeroUc:
      asString(project.numeroUc) ||
      asString(project.numero_uc) ||
      asString(project.unit_control) ||
      asString(project.ucNumber) ||
      asString(project.unitControl) ||
      asString(project.unidade_controladora) ||
      undefined,
    dataAbertura:
      asString(project.dataAbertura) ||
      asString(project.data_abertura) ||
      asString(project.openingDate) ||
      asString(project.created_at) ||
      asString(project.createdAt) ||
      undefined,
    coordenadas:
      asCoordinateObject(project.coordenadas) ||
      asCoordinateObject(project.coordinates) ||
      (asString(project.latitude) && asString(project.longitude)
        ? { latitude: asString(project.latitude), longitude: asString(project.longitude) }
        : undefined),
    latitude:
      asString(project.latitude) ||
      asString((isRecord(project.coordenadas) ? project.coordenadas.latitude : undefined)) ||
      asString((isRecord(project.coordinates) ? project.coordinates.latitude : undefined)) ||
      undefined,
    longitude:
      asString(project.longitude) ||
      asString((isRecord(project.coordenadas) ? project.coordenadas.longitude : undefined)) ||
      asString((isRecord(project.coordinates) ? project.coordinates.longitude : undefined)) ||
      undefined,
    tensaoFornecimento: asString(project.tensaoFornecimento) || undefined,
    padraoEntradaItens: asArray<PadraoEntradaItem>(project.padraoEntradaItens),
    projetoFastTrack:
      asBooleanString(project.projetoFastTrack) ||
      asBooleanString(project.projeto_fast_track) ||
      asBooleanString(project.fast_track) ||
      asBooleanString(project.fastTrack) ||
      undefined,
    projetoNovo:
      asBooleanString(project.projetoNovo) ||
      asBooleanString(project.projeto_novo) ||
      asBooleanString(project.projectNew) ||
      asBooleanString(project.newProject) ||
      undefined,
    zeroGridControleExportacao:
      asBooleanString(project.zeroGridControleExportacao) ||
      asBooleanString(project.zero_grid_controle_exportacao) ||
      asBooleanString(project.zeroGridControlExport) ||
      undefined,
    observacoes:
      asString(project.observacoes) ||
      asString(project['descrição']) ||
      asString(project['descriÃ§Ã£o']) ||
      asString(project.descricao) ||
      asString(project.description) ||
      asString(project.observations) ||
      undefined,
    dataCriacao:
      asString(project.dataCriacao) ||
      asString(project.created_at) ||
      asString(project.createdAt) ||
      new Date().toISOString(),
    dataAtualizacao:
      asString(project.dataAtualizacao) ||
      asString(project.updated_at) ||
      asString(project.updatedAt) ||
      new Date().toISOString()
  };

  return applyDerivedDadosTecnicos({
    ...projetoNormalizado,
    timeline:
      projetoNormalizado.timeline.length > 0
        ? projetoNormalizado.timeline
        : buildFallbackTimeline(projetoNormalizado)
  });
};

const buildInitialTimeline = (projectData: CreateProjectData): Projeto['timeline'] => {
  const currentStatus = toProjetoStatus(projectData.status);
  const protocol = asString(projectData.utilityProtocol) || 'novo projeto';

  return STATUS_FLOW.map((item, index) => ({
    id: crypto.randomUUID(),
    etapa: item.etapa,
    data: index === 0 ? projectData.dataAbertura || new Date().toISOString() : new Date().toISOString(),
    status: getTimelineStatusFromProjectStatus(item.status, currentStatus),
    descricao:
      item.status === currentStatus
        ? `Projeto ${protocol} criado no frontend e pronto para receber historico oficial do backend.`
        : item.status === 'em_analise_documentacao'
          ? 'Projeto aberto e aguardando evolucao das proximas etapas.'
          : 'Etapa prevista no fluxo padrao do projeto.'
  }));
};

const buildTimelineForProjectStatus = (project: Projeto, status: StatusProjeto, descricaoAtual?: string): Projeto['timeline'] =>
  STATUS_FLOW.map((item, index) => ({
    id: `${project.id}-timeline-${item.status}`,
    etapa: item.etapa,
    data: index === 0 ? project.dataAbertura || project.dataCriacao : new Date().toISOString(),
    status: getTimelineStatusFromProjectStatus(item.status, status),
    descricao:
      item.status === status
        ? descricaoAtual || `Status atual do projeto ${project.protocolo}.`
        : item.status === 'aguardando_aprovacao'
          ? 'Projeto aguardando validacao administrativa antes de entrar no fluxo operacional.'
          : 'Etapa prevista no fluxo padrao do projeto.'
  }));

const buildFrontendEnhancement = (projectData: CreateProjectData): FrontendProjectEnhancement => ({
  modulos: projectData.modulos ?? [],
  inversores: projectData.inversores ?? [],
  divisaoCreditos: projectData.divisaoCreditos ?? [],
  documentos: projectData.documentos ?? [],
  coordenadas: projectData.coordinates,
  latitude: asString(projectData.latitude) || undefined,
  longitude: asString(projectData.longitude) || undefined,
  tensaoFornecimento: asString(projectData.tensaoFornecimento) || undefined,
  padraoEntradaItens: projectData.padraoEntradaItens ?? [],
  tipoProjeto: projectData.projectType,
  servicos: projectData.servicesNames,
  numeroUc: projectData.unitControl,
  dataAbertura: projectData.dataAbertura,
  projetoFastTrack: projectData.fastTrack,
  projetoNovo: projectData.projetoNovo,
  zeroGridControleExportacao: projectData.zeroGridControleExportacao,
  observacoes: projectData.description,
  status: toProjetoStatus(projectData.status),
  timeline: buildInitialTimeline(projectData)
});

const mergeProjectEnhancement = (project: Projeto): Projeto => {
  const enhancement = projectEnhancementsStorage.read()[project.id];
  if (!enhancement) {
    return project;
  }

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
    zeroGridControleExportacao: enhancement.zeroGridControleExportacao || project.zeroGridControleExportacao,
    observacoes: enhancement.observacoes || project.observacoes,
    status: project.status,
    timeline: timeline.length > 0 ? timeline : project.timeline,
    padraoEntradaItens: padraoEntradaItens.length > 0 ? padraoEntradaItens : project.padraoEntradaItens,
    dadosTecnicos: {
      ...project.dadosTecnicos,
      modulos: modulos.length > 0 ? modulos : project.dadosTecnicos.modulos,
      inversores: inversores.length > 0 ? inversores : project.dadosTecnicos.inversores,
      divisaoCreditos: divisaoCreditos.length > 0 ? divisaoCreditos : project.dadosTecnicos.divisaoCreditos
    }
  });
};

const PROJECTS_ENDPOINT = '/projects';

const createRaw = async (projectData: CreateProjectData): Promise<unknown> => {
  const payload: Record<string, unknown> = {
    client_id: projectData.clientId,
    clientId: projectData.clientId,
    clienteId: projectData.clientId,
    address_id: projectData.addressId,
    addressId: projectData.addressId,
    enderecoId: projectData.addressId,
    utility_company: projectData.utilityCompany,
    utilityCompany: projectData.utilityCompany,
    concessionaria: projectData.utilityCompany,
    utility_protocol: projectData.utilityProtocol,
    utilityProtocol: projectData.utilityProtocol,
    protocoloConcessionaria: projectData.utilityProtocol,
    customer_class: projectData.customerClass,
    customerClass: projectData.customerClass,
    classe: projectData.customerClass,
    integrator: projectData.integrator,
    modality: projectData.modality,
    modalidade: projectData.modality,
    framework: projectData.framework,
    enquadramento: projectData.framework,
    dc_protection: projectData.dcProtection,
    dcProtection: projectData.dcProtection,
    protecaoCC: projectData.dcProtection,
    system_power: projectData.systemPower,
    systemPower: projectData.systemPower,
    potenciaSistema: projectData.systemPower,
    status: projectData.status,
    amount: projectData.amount !== undefined ? String(projectData.amount) : undefined,
    valor: projectData.amount !== undefined ? String(projectData.amount) : undefined,
    coordinates: projectData.coordinates,
    coordenadas: projectData.coordinates,
    services_names: projectData.servicesNames,
    servicesNames: projectData.servicesNames,
    servicos: projectData.servicesNames,
    project_type: projectData.projectType,
    projectType: projectData.projectType,
    tipo_projeto: projectData.projectType,
    fast_track: projectData.fastTrack === 'sim',
    fastTrack: projectData.fastTrack === 'sim',
    projeto_fast_track: projectData.fastTrack === 'sim',
    unit_control: projectData.unitControl,
    unitControl: projectData.unitControl
    ,
    unidade_controladora: projectData.unitControl
  };

  if (projectData.description) {
    payload.description = projectData.description;
    payload['descri\u00e7\u00e3o'] = projectData.description;
  }

  return apiClient.post<unknown>(PROJECTS_ENDPOINT, payload);
};

const isMissingCustomerName = (name: string) => {
  const normalized = name.trim().toLowerCase();
  return !normalized || normalized === 'cliente sem nome';
};

const enrichProjectsWithCustomers = async (projects: Projeto[]): Promise<Projeto[]> => {
  const requiresEnrichment = projects.some((project) => isMissingCustomerName(project.cliente.nome));
  if (!requiresEnrichment) {
    return projects;
  }

  try {
    const customers = await customersService.getAll();
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));

    return projects.map((project) => {
      const knownCustomer = customersById.get(project.cliente.id);
      if (!knownCustomer) {
        return project;
      }

      return {
        ...project,
        cliente: {
          ...project.cliente,
          nome: isMissingCustomerName(project.cliente.nome) ? knownCustomer.nome : project.cliente.nome,
          cpfCnpj: project.cliente.cpfCnpj || knownCustomer.cpfCnpj,
          telefone: project.cliente.telefone || knownCustomer.telefone,
          email: project.cliente.email || knownCustomer.email
        },
        endereco: hasAddressData(project.endereco)
          ? project.endereco
          : {
              cep: knownCustomer.endereco?.cep || '',
              logradouro: knownCustomer.endereco?.logradouro || '',
              numero: knownCustomer.endereco?.numero || '',
              complemento: knownCustomer.endereco?.complemento || '',
              bairro: knownCustomer.endereco?.bairro || '',
              cidade: knownCustomer.endereco?.cidade || '',
              estado: knownCustomer.endereco?.estado || '',
              link: knownCustomer.endereco?.link
            }
      };
    });
  } catch (error) {
    console.error('Erro ao enriquecer projetos com clientes:', error);
    return projects;
  }
};

export const projectsService = {
  saveDocuments(projectId: string, documentos: Documento[]) {
    // Documentos enviados apos a criacao do projeto precisam ser persistidos no enhancement local
    // porque o fluxo de upload e separado do POST principal de projeto.
    updateProjectEnhancement(projectId, (current) => ({
      ...current,
      documentos
    }));
  },

  saveStatusTimeline(projectId: string, item: Projeto['timeline'][number], observacoes?: string) {
    updateProjectEnhancement(projectId, (current) => {
      const previousTimeline = current?.timeline ?? [];

      return {
        ...current,
        observacoes: observacoes ?? current?.observacoes,
        timeline: [item, ...previousTimeline]
      };
    });
  },

  async create(projectData: CreateProjectData): Promise<Project> {
    const response = await createRaw(projectData);
    const normalized = normalizeProjeto(response);
    saveProjectEnhancement(normalized.id, buildFrontendEnhancement(projectData));
    const mergedProject = mergeProjectEnhancement(normalized);
    approvalsService.createForNonAdmin({
      entityType: 'projeto',
      entityId: mergedProject.id,
      entityLabel: mergedProject.protocolo,
      clientName: mergedProject.cliente.nome
    });
    return mergedProject;
  },

  async approvePending(id: string, nextStatus: StatusProjeto = 'em_analise_documentacao'): Promise<Project> {
    const project = await projectsService.getById(id);
    await projectsService.update(id, {
      status: nextStatus
    });

    updateProjectEnhancement(id, (current) => ({
      ...current,
      status: nextStatus,
      timeline: buildTimelineForProjectStatus(
        project,
        nextStatus,
        'Projeto aprovado no frontend e liberado para o fluxo operacional.'
      )
    }));

    return projectsService.getById(id);
  },

  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<unknown[] | PaginatedResponse<unknown>>(PROJECTS_ENDPOINT);
    const projects = extractDataFromList(response).map(normalizeProjeto).map(mergeProjectEnhancement);
    return enrichProjectsWithCustomers(projects);
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<unknown>(`/projects/${id}`);
    const normalized = mergeProjectEnhancement(normalizeProjeto(response));
    const customerDetails =
      normalized.cliente.id && normalized.cliente.id !== 'sem-cliente'
        ? await customersService.getById(normalized.cliente.id).catch(() => null)
        : null;
    const [enrichedProject] = await enrichProjectsWithCustomers([normalized]);
    const enriched = customerDetails && !hasAddressData(enrichedProject.endereco)
      ? {
          ...enrichedProject,
          cliente: {
            ...enrichedProject.cliente,
            nome: enrichedProject.cliente.nome || customerDetails.nome,
            cpfCnpj: enrichedProject.cliente.cpfCnpj || customerDetails.cpfCnpj,
            telefone: enrichedProject.cliente.telefone || customerDetails.telefone,
            email: enrichedProject.cliente.email || customerDetails.email
          },
          endereco: customerDetails.endereco
            ? {
                cep: customerDetails.endereco.cep || '',
                logradouro: customerDetails.endereco.logradouro || '',
                numero: customerDetails.endereco.numero || '',
                complemento: customerDetails.endereco.complemento || '',
                bairro: customerDetails.endereco.bairro || '',
                cidade: customerDetails.endereco.cidade || '',
                estado: customerDetails.endereco.estado || '',
                link: customerDetails.endereco.link
              }
            : enrichedProject.endereco
        }
      : enrichedProject;

    return enriched;
  },

  async getByIdRaw(id: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get<unknown>(`/projects/${id}`);
    return isRecord(response) ? response : {};
  },

  async update(id: string, projectData: UpdateProjectData | Record<string, unknown>): Promise<Project> {
    const normalizedFastTrack =
      isRecord(projectData) && typeof projectData.fastTrack === 'string'
        ? projectData.fastTrack === 'sim'
        : isRecord(projectData)
          ? projectData.fastTrack
          : undefined;
    const payloadWithId = isRecord(projectData)
      ? {
          id,
          ...projectData,
          client_id: projectData.clientId,
          clienteId: projectData.clientId,
          address_id: projectData.addressId,
          enderecoId: projectData.addressId,
          utility_company: projectData.utilityCompany,
          concessionaria: projectData.utilityCompany,
          utility_protocol: projectData.utilityProtocol,
          protocoloConcessionaria: projectData.utilityProtocol,
          customer_class: projectData.customerClass,
          classe: projectData.customerClass,
          modalidade: projectData.modality,
          enquadramento: projectData.framework,
          dc_protection: projectData.dcProtection,
          protecaoCC: projectData.dcProtection,
          system_power: projectData.systemPower,
          potenciaSistema: projectData.systemPower,
          valor:
            typeof projectData.amount === 'number'
              ? String(projectData.amount)
              : projectData.amount,
          coordenadas: projectData.coordinates,
          services_names: projectData.servicesNames,
          servicos: projectData.servicesNames,
          project_type: projectData.projectType,
          tipo_projeto: projectData.projectType,
          fast_track: normalizedFastTrack,
          projeto_fast_track: normalizedFastTrack,
          unit_control: projectData.unitControl,
          unidade_controladora: projectData.unitControl,
          'descri\u00e7\u00e3o': projectData.description,
          amount:
            typeof projectData.amount === 'number'
              ? String(projectData.amount)
              : projectData.amount,
          fastTrack: normalizedFastTrack
        }
      : { id };
    const response = await apiClient.put<unknown>(`${PROJECTS_ENDPOINT}/${id}`, payloadWithId);
    return normalizeProjeto(response);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/projects/${id}`);
  },

  async getProjetos(): Promise<Projeto[]> {
    return projectsService.getAll();
  },

  async getProjetoById(id: string): Promise<Projeto | null> {
    try {
      return await projectsService.getById(id);
    } catch {
      return null;
    }
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const projetos = await projectsService.getProjetos();
    const statusPendente = new Set<StatusProjeto>([
      'em_analise_documentacao',
      'elaboracao_documentacao_tecnica',
      'aguardando_assinatura_cliente',
      'aguardando_pagamento'
    ]);
    const statusFinalizado = new Set<StatusProjeto>(['projeto_encerrado']);

    return {
      totalProjetos: projetos.length,
      projetosEmAndamento: projetos.filter((p) => !statusPendente.has(p.status) && !statusFinalizado.has(p.status)).length,
      projetosFinalizados: projetos.filter((p) => statusFinalizado.has(p.status)).length,
      projetosPendentes: projetos.filter((p) => statusPendente.has(p.status)).length
    };
  }
};


