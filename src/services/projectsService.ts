/** Camada de acesso a dados para 'projectsService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Documento, PadraoEntradaItem, Projeto, DashboardStats, PaginatedResponse, StatusProjeto } from '../types';
import { apiClient } from './apiClient';
import { customersService } from './customersService';

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

type UnknownRecord = Record<string, unknown>;
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
>>;

type TimelineStatus = Projeto['timeline'][number]['status'];

const PROJECTS_FRONTEND_STORAGE_KEY = 'opj_frontend_project_enhancements';

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBrowser = typeof window !== 'undefined';

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asBooleanString = (value: unknown): string | undefined => {
  if (typeof value === 'boolean') {
    return value ? 'sim' : 'nao';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === 'sim') {
      return 'sim';
    }

    if (normalized === 'false' || normalized === 'nao') {
      return 'nao';
    }

    return value;
  }

  return undefined;
};

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value
      .trim()
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=.*\.)/g, '')
      .replace(',', '.');
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

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

const readProjectEnhancements = (): Record<string, FrontendProjectEnhancement> => {
  if (!isBrowser) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(PROJECTS_FRONTEND_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as Record<string, FrontendProjectEnhancement>) : {};
  } catch (error) {
    console.error('Erro ao carregar dados locais complementares de projetos:', error);
    return {};
  }
};

const writeProjectEnhancements = (enhancements: Record<string, FrontendProjectEnhancement>) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(PROJECTS_FRONTEND_STORAGE_KEY, JSON.stringify(enhancements));
  } catch (error) {
    console.error('Erro ao salvar dados locais complementares de projetos:', error);
  }
};

const saveProjectEnhancement = (projectId: string, enhancement: FrontendProjectEnhancement) => {
  const current = readProjectEnhancements();
  current[projectId] = {
    ...current[projectId],
    ...enhancement
  };
  writeProjectEnhancements(current);
};

const updateProjectEnhancement = (
  projectId: string,
  updater: (current: FrontendProjectEnhancement | undefined) => FrontendProjectEnhancement
) => {
  const current = readProjectEnhancements();
  current[projectId] = updater(current[projectId]);
  writeProjectEnhancements(current);
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

const STATUS_FLOW: Array<{ status: StatusProjeto; etapa: string }> = [
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

const toProjetoStatus = (rawStatus: unknown): StatusProjeto => {
  const status = normalizeStatusKey(rawStatus);

  switch (status) {
    case 'em_analise_documentacao':
      return 'em_analise_documentacao';
    case 'elaboracao_documentacao_tecnica':
      return 'elaboracao_documentacao_tecnica';
    case 'aguardando_assinatura_cliente':
      return 'aguardando_assinatura_cliente';
    case 'projeto_enviado_aguardando_protocolo_concessionaria':
      return 'projeto_enviado_aguardando_protocolo_concessionaria';
    case 'em_analise_concessionaria':
      return 'em_analise_concessionaria';
    case 'ressalvas_projetos':
      return 'ressalvas_projetos';
    case 'obras_concessionaria':
      return 'obras_concessionaria';
    case 'projeto_aprovado':
      return 'projeto_aprovado';
    case 'vistoria_solicitada':
      return 'vistoria_solicitada';
    case 'vistoria_reprovada':
      return 'vistoria_reprovada';
    case 'aguardando_pagamento':
      return 'aguardando_pagamento';
    case 'projeto_encerrado':
      return 'projeto_encerrado';
    case 'completed':
    case 'concluido':
      return 'projeto_encerrado';
    case 'active':
    case 'em_analise':
    case 'in_progress':
    case 'em_andamento':
      return 'em_analise_concessionaria';
    case 'novo':
    case 'pending':
    case 'pendente':
      return 'em_analise_documentacao';
    case 'approved':
    case 'aprovado':
      return 'projeto_aprovado';
    case 'cancelled':
    case 'cancelado':
      return 'projeto_encerrado';
    case 'installation':
    case 'instalacao':
      return 'obras_concessionaria';
    case 'aguardando_aprovacao':
      return 'aguardando_assinatura_cliente';
    default:
      return 'em_analise_documentacao';
  }
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
      concessionaria: asString(dadosProjeto.concessionaria) || asString(project.concessionaria),
      classe: asString(dadosProjeto.classe) || asString(project.classe) || asString(project.customerClass),
      integrador: asString(dadosProjeto.integrador) || asString(project.integrator),
      modalidade: normalizeModalidade(dadosProjeto.modalidade || project.modalidade || project.modality),
      enquadramento: asString(dadosProjeto.enquadramento) || asString(project.enquadramento) || asString(project.framework),
      potenciaSistema: asNumber(dadosProjeto.potenciaSistema ?? project.potenciaSistema ?? project.systemPower),
      protecaoCC: asString(dadosProjeto.protecaoCC) || asString(project.protecaoCC) || asString(project.dcProtection)
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
      asString(project.tipoProjeto) || asString(project.tipo_projeto) || asString(project.projectType) || undefined,
    servicos: asArray<string>(project.servicos ?? project.servicesNames),
    numeroUc:
      asString(project.numeroUc) ||
      asString(project.numero_uc) ||
      asString(project.ucNumber) ||
      asString(project.unitControl) ||
      asString(project.unidade_controladora) ||
      undefined,
    dataAbertura:
      asString(project.dataAbertura) ||
      asString(project.data_abertura) ||
      asString(project.openingDate) ||
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
      asBooleanString(project.zeroGridControleExportacao) ||
      undefined,
    observacoes:
      asString(project.observacoes) ||
      asString(project['descrição']) ||
      asString(project['descriÃ§Ã£o']) ||
      asString(project.descricao) ||
      asString(project.description) ||
      asString(project.observations) ||
      undefined,
    dataCriacao: asString(project.dataCriacao) || asString(project.createdAt) || new Date().toISOString(),
    dataAtualizacao: asString(project.dataAtualizacao) || asString(project.updatedAt) || new Date().toISOString()
  };

  return {
    ...projetoNormalizado,
    timeline:
      projetoNormalizado.timeline.length > 0
        ? projetoNormalizado.timeline
        : buildFallbackTimeline(projetoNormalizado)
  };
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
  timeline: buildInitialTimeline(projectData)
});

const mergeProjectEnhancement = (project: Projeto): Projeto => {
  const enhancement = readProjectEnhancements()[project.id];
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

  return {
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
    timeline: timeline.length > 0 ? timeline : project.timeline,
    padraoEntradaItens: padraoEntradaItens.length > 0 ? padraoEntradaItens : project.padraoEntradaItens,
    dadosTecnicos: {
      ...project.dadosTecnicos,
      modulos: modulos.length > 0 ? modulos : project.dadosTecnicos.modulos,
      inversores: inversores.length > 0 ? inversores : project.dadosTecnicos.inversores,
      divisaoCreditos: divisaoCreditos.length > 0 ? divisaoCreditos : project.dadosTecnicos.divisaoCreditos
    }
  };
};

const PROJECTS_ENDPOINT = '/projects';

const createRaw = async (projectData: CreateProjectData): Promise<unknown> => {
  const { latitude, longitude, tensaoFornecimento, padraoEntradaItens, modulos, inversores, documentos } = projectData;
  void latitude;
  void longitude;
  void tensaoFornecimento;
  void padraoEntradaItens;
  void modulos;
  void inversores;
  void documentos;

  const payload: Record<string, unknown> = {
    clientId: projectData.clientId,
    clienteId: projectData.clientId,
    addressId: projectData.addressId,
    enderecoId: projectData.addressId,
    utilityCompany: projectData.utilityCompany,
    concessionaria: projectData.utilityCompany,
    utilityProtocol: projectData.utilityProtocol,
    protocoloConcessionaria: projectData.utilityProtocol,
    customerClass: projectData.customerClass,
    classe: projectData.customerClass,
    integrator: projectData.integrator,
    modality: projectData.modality,
    modalidade: projectData.modality,
    framework: projectData.framework,
    enquadramento: projectData.framework,
    dcProtection: projectData.dcProtection,
    protecaoCC: projectData.dcProtection,
    systemPower: projectData.systemPower,
    potenciaSistema: projectData.systemPower,
    status: projectData.status,
    amount: projectData.amount !== undefined ? String(projectData.amount) : undefined,
    valor: projectData.amount !== undefined ? String(projectData.amount) : undefined,
    coordinates: projectData.coordinates,
    coordenadas: projectData.coordinates,
    servicesNames: projectData.servicesNames,
    servicos: projectData.servicesNames,
    projectType: projectData.projectType,
    tipo_projeto: projectData.projectType,
    fastTrack: projectData.fastTrack === 'sim',
    projeto_fast_track: projectData.fastTrack === 'sim',
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
    return mergeProjectEnhancement(normalized);
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

    try {
      const allProjects = await projectsService.getAll();
      const listedProject = allProjects.find((project) => project.id === id);

      if (!listedProject) {
        return enriched;
      }

      return mergeProjectEnhancement({
        ...enriched,
        cliente: {
          ...listedProject.cliente,
          ...enriched.cliente
        },
        endereco: {
          ...listedProject.endereco,
          ...enriched.endereco
        },
        dadosProjeto: {
          ...listedProject.dadosProjeto,
          ...enriched.dadosProjeto
        },
        dadosTecnicos: {
          ...listedProject.dadosTecnicos,
          ...enriched.dadosTecnicos
        },
        valor: enriched.valor || listedProject.valor,
        status: enriched.status || listedProject.status,
        tipoProjeto: enriched.tipoProjeto || listedProject.tipoProjeto,
        servicos: enriched.servicos?.length ? enriched.servicos : listedProject.servicos,
        numeroUc: enriched.numeroUc || listedProject.numeroUc,
        dataAbertura: enriched.dataAbertura || listedProject.dataAbertura,
        coordenadas: enriched.coordenadas || listedProject.coordenadas,
        latitude: enriched.latitude || listedProject.latitude,
        longitude: enriched.longitude || listedProject.longitude,
        tensaoFornecimento: enriched.tensaoFornecimento || listedProject.tensaoFornecimento,
        padraoEntradaItens:
          (enriched.padraoEntradaItens?.length ?? 0) > 0 ? enriched.padraoEntradaItens : listedProject.padraoEntradaItens,
        projetoFastTrack: enriched.projetoFastTrack || listedProject.projetoFastTrack,
        projetoNovo: enriched.projetoNovo || listedProject.projetoNovo,
        zeroGridControleExportacao: enriched.zeroGridControleExportacao || listedProject.zeroGridControleExportacao,
        observacoes: enriched.observacoes || listedProject.observacoes,
        modulos: enriched.modulos.length > 0 ? enriched.modulos : listedProject.modulos,
        inversores: enriched.inversores.length > 0 ? enriched.inversores : listedProject.inversores,
        divisaoCreditos:
          enriched.divisaoCreditos.length > 0 ? enriched.divisaoCreditos : listedProject.divisaoCreditos,
        documentos: enriched.documentos.length > 0 ? enriched.documentos : listedProject.documentos
      });
    } catch (error) {
      console.error('Erro ao complementar dados do projeto pelo endpoint de listagem:', error);
      return enriched;
    }
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
          clienteId: projectData.clientId,
          enderecoId: projectData.addressId,
          concessionaria: projectData.utilityCompany,
          protocoloConcessionaria: projectData.utilityProtocol,
          classe: projectData.customerClass,
          modalidade: projectData.modality,
          enquadramento: projectData.framework,
          protecaoCC: projectData.dcProtection,
          potenciaSistema: projectData.systemPower,
          valor:
            typeof projectData.amount === 'number'
              ? String(projectData.amount)
              : projectData.amount,
          coordenadas: projectData.coordinates,
          servicos: projectData.servicesNames,
          tipo_projeto: projectData.projectType,
          projeto_fast_track: normalizedFastTrack,
          unidade_controladora: projectData.unitControl,
          'descri\u00e7\u00e3o': projectData.description,
          amount:
            typeof projectData.amount === 'number'
              ? String(projectData.amount)
              : projectData.amount,
          fastTrack: normalizedFastTrack
        }
      : { id };
    const response = await apiClient.put<unknown>(PROJECTS_ENDPOINT, payloadWithId);
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


