import type { PadraoEntradaItem, Projeto, PaginatedResponse, StatusProjeto } from '@/types';
import { asArray, asBooleanString, asNumber, asString, isRecord } from '@/core/utils/normalize';

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

type TimelineStatus = Projeto['timeline'][number]['status'];

// --- Derivação de dados técnicos ---

const asCoordinateObject = (value: unknown): Projeto['coordenadas'] | undefined => {
  if (!isRecord(value)) return undefined;
  const latitude = asString(value.latitude);
  const longitude = asString(value.longitude);
  if (!latitude || !longitude) return undefined;
  return { latitude, longitude };
};

const deriveTensao = (tensaoAtual: number, tensaoFornecimento?: string) => {
  if (tensaoAtual > 0) return tensaoAtual;
  const normalized = asString(tensaoFornecimento);
  if (!normalized) return 0;
  const values = normalized
    .replace(/[^\d/]/g, '')
    .split('/')
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);
  return values.length > 0 ? Math.max(...values) : 0;
};

const deriveNumeroFases = (numeroFasesAtual: number, padraoEntradaItens?: PadraoEntradaItem[], tensaoFornecimento?: string) => {
  if (numeroFasesAtual > 0) return numeroFasesAtual;
  const tipoLigacao = padraoEntradaItens?.find((item) => asString(item.tipoLigacao))?.tipoLigacao?.toLowerCase() ?? '';
  if (tipoLigacao.includes('trif')) return 3;
  if (tipoLigacao.includes('bif')) return 2;
  if (tipoLigacao.includes('mono')) return 1;
  const normalized = asString(tensaoFornecimento).toLowerCase();
  if (normalized.includes('380')) return 3;
  if (normalized.includes('220')) return 2;
  return 0;
};

const deriveRamal = (ramalAtual: string, padraoEntradaItens?: PadraoEntradaItem[], numeroFases?: number) => {
  if (ramalAtual.trim()) return ramalAtual;
  const tipoLigacao = padraoEntradaItens?.find((item) => asString(item.tipoLigacao))?.tipoLigacao?.trim();
  if (tipoLigacao) return tipoLigacao;
  if (numeroFases === 3) return 'Trifasico';
  if (numeroFases === 2) return 'Bifasico';
  if (numeroFases === 1) return 'Monofasico';
  return '';
};

const deriveDisjuntor = (disjuntorAtual: string, padraoEntradaItens?: PadraoEntradaItem[], protecaoCC?: string) => {
  if (disjuntorAtual.trim()) return disjuntorAtual;
  const padraoDisjuntor = padraoEntradaItens?.find((item) => asString(item.disjuntor))?.disjuntor?.trim();
  if (padraoDisjuntor) return padraoDisjuntor;
  return asString(protecaoCC);
};

const deriveCargaInstalada = (
  cargaInstaladaAtual: number,
  modulos: Projeto['modulos'],
  inversores: Projeto['inversores'],
  potenciaSistemaKw: number
) => {
  if (cargaInstaladaAtual > 0) return cargaInstaladaAtual;
  const cargaModulos = modulos.reduce((total, item) => total + (Number(item.quantidade) || 0) * (Number(item.potencia) || 0), 0);
  const cargaInversores = inversores.reduce((total, item) => total + (Number(item.quantidade) || 0) * (Number(item.potencia) || 0), 0);
  const cargaSistema = Math.round((Number(potenciaSistemaKw) || 0) * 1000);
  return Math.max(cargaModulos, cargaInversores, cargaSistema, 0);
};

export const applyDerivedDadosTecnicos = (project: Projeto): Projeto => {
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
    dadosTecnicos: { ...project.dadosTecnicos, tensao, numeroFases, ramal, disjuntor, cargaInstalada }
  };
};

// --- Normalização de status ---

export const normalizeStatusKey = (rawStatus: unknown): string =>
  asString(rawStatus)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s-]+/g, '_');

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

export const toProjetoStatus = (rawStatus: unknown): StatusProjeto => {
  const status = normalizeStatusKey(rawStatus);
  if (VALID_STATUSES.has(status as StatusProjeto)) return status as StatusProjeto;
  return STATUS_ALIASES[status] ?? 'em_analise_documentacao';
};

// --- Timeline helpers ---

export const getTimelineStatusFromProjectStatus = (status: StatusProjeto, currentStatus: StatusProjeto): TimelineStatus => {
  const currentIndex = projectStatusFlow.findIndex((item) => item.status === currentStatus);
  const itemIndex = projectStatusFlow.findIndex((item) => item.status === status);
  if (itemIndex < 0 || currentIndex < 0) return 'pendente';
  if (itemIndex < currentIndex) return 'concluido';
  if (itemIndex === currentIndex) {
    return currentStatus === 'projeto_aprovado' || currentStatus === 'projeto_encerrado' ? 'concluido' : 'em_andamento';
  }
  return 'pendente';
};

const normalizeTimelineItem = (item: unknown): Projeto['timeline'][number] | null => {
  if (!isRecord(item)) return null;
  const etapa = asString(item.etapa) || asString(item.stage) || asString(item.title);
  if (!etapa) return null;
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
  if (modalidade.includes('compart')) return 'geracao_compartilhada';
  if (modalidade.includes('remoto')) return 'autoconsumo_remoto';
  return 'autoconsumo_local';
};

const buildFallbackTimeline = (project: Pick<Projeto, 'id' | 'status' | 'dataAbertura' | 'dataCriacao' | 'dataAtualizacao' | 'dadosProjeto' | 'protocolo'>) =>
  projectStatusFlow.map((item, index) => {
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

// --- Paginação ---

export const extractDataFromList = (response: unknown[] | PaginatedResponse<unknown>) => {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.data) ? response.data : [];
};

// --- Normalizador principal ---

/*@TODO BARGARAI È MUITO TRABALHO NÃO DEIXAR ISSO EM INGLES!!*/

export const normalizeProjeto = (raw: unknown): Projeto => {
  // Adapter que protege a UI contra variacoes de nomenclatura do backend e payloads parciais.
  const project = isRecord(raw) ? raw : {};

  const sequence = asNumber(project.sequence);
  const subsequente = asString(project.subsequente);

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
    sequence,
    subsequente,
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
      modalidade: normalizeModalidade(dadosProjeto.modalidade ?? project.modalidade ?? project.modality),
      enquadramento:
        asString(dadosProjeto.enquadramento) ||
        asString(project.enquadramento) ||
        asString(project.framework),
      potenciaSistema:
        asNumber(dadosProjeto.potenciaSistema ?? project.potenciaSistema ?? project.system_power ?? project.systemPower),
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
