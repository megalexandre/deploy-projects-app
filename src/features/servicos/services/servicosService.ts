/** Camada local para 'servicosService': persiste cadastro estruturado de servicos enquanto a API nao existe. */
import type { Documento, DivisaoCreditos, Endereco, PadraoEntradaItem, Servico, StatusServico, TimelineItem, TipoServico } from '@/types';
import { asNumber } from '@/core/utils/normalize';
import { createArrayStorage } from '@/core/utils/storage';
import { approvalsService } from '@/features/aprovacoes/services/approvalsService';

export interface CreateServicoPayload {
  tipo: TipoServico;
  cliente: string;
  clienteId?: string;
  concessionaria: string;
  dataAbertura: string;
  valor: number;
  cupomDescontoPct?: number;
  observacoes?: string;
  tensaoFornecimento?: Servico['tensaoFornecimento'];
  coordenadas?: Servico['coordenadas'];
  pontoReferencia?: string;
  padraoMaisDe30m?: Servico['padraoMaisDe30m'];
  enderecoObra?: Endereco;
  ucGeradora?: string;
  enderecoGeradora?: Endereco;
  padraoEntradaItens?: PadraoEntradaItem[];
  rateios?: DivisaoCreditos[];
  documentos?: Documento[];
}

export interface UpdateServicoPayload extends Partial<CreateServicoPayload> {
  status?: StatusServico;
  timeline?: TimelineItem[];
}

const servicosStorage = createArrayStorage<Partial<Servico>>('opj_frontend_servicos');

const SERVICE_STATUS_FLOW: Array<{ status: StatusServico; etapa: string }> = [
  { status: 'abertura_servico', etapa: 'Abertura do Servico' },
  { status: 'elaboracao_documentacao', etapa: 'Elaboracao da Documentacao' },
  { status: 'aguardando_assinatura_cliente', etapa: 'Aguardando Assinatura do Cliente' },
  { status: 'aguardando_protocolo_concessionaria', etapa: 'Aguardando Protocolo da Concessionaria' },
  { status: 'em_analise_concessionaria', etapa: 'Em Analise na Concessionaria' },
  { status: 'ressalvas', etapa: 'Ressalvas' },
  { status: 'obras_concessionaria', etapa: 'Obras Concessionaria' },
  { status: 'servico_aprovado', etapa: 'Servico Aprovado' },
  { status: 'vistoria_solicitada', etapa: 'Vistoria Solicitada' },
  { status: 'vistoria_reprovada', etapa: 'Vistoria Reprovada' },
  { status: 'servico_encerrado', etapa: 'Servico Encerrado' }
];

const SERVICE_TYPE_LABELS: Record<TipoServico, string> = {
  ligacao_nova: 'Ligacao Nova',
  aumento_carga: 'Aumento de Carga',
  troca_titularidade: 'Troca de Titularidade',
  alteracao_compartilhamento_credito: 'Alteracao Compartilhamento de Credito'
};

const normalizeText = (value?: string) => value?.trim() ?? '';

const cloneEndereco = (endereco?: Endereco): Endereco | undefined =>
  endereco
    ? {
        cep: normalizeText(endereco.cep),
        logradouro: normalizeText(endereco.logradouro),
        numero: normalizeText(endereco.numero),
        complemento: normalizeText(endereco.complemento),
        bairro: normalizeText(endereco.bairro),
        cidade: normalizeText(endereco.cidade),
        estado: normalizeText(endereco.estado),
        link: normalizeText(endereco.link) || undefined
      }
    : undefined;

const normalizeStatus = (value?: string): StatusServico => {
  const normalized = normalizeText(value).toLowerCase();
  const found = SERVICE_STATUS_FLOW.find((item) => item.status === normalized);
  return found?.status ?? 'abertura_servico';
};

const getTimelineStatus = (status: StatusServico, currentStatus: StatusServico): TimelineItem['status'] => {
  const currentIndex = SERVICE_STATUS_FLOW.findIndex((item) => item.status === currentStatus);
  const itemIndex = SERVICE_STATUS_FLOW.findIndex((item) => item.status === status);

  if (itemIndex < currentIndex) {
    return 'concluido';
  }

  if (itemIndex === currentIndex) {
    return currentStatus === 'servico_aprovado' || currentStatus === 'servico_encerrado' ? 'concluido' : 'em_andamento';
  }

  return 'pendente';
};

const buildTimeline = (id: string, status: StatusServico, dataAbertura: string, dataAtualizacao: string): TimelineItem[] =>
  SERVICE_STATUS_FLOW.map((item, index) => ({
    id: `${id}-${item.status}`,
    etapa: item.etapa,
    data: index === 0 ? dataAbertura : dataAtualizacao,
    status: getTimelineStatus(item.status, status),
    descricao: item.status === status ? 'Etapa atual do servico.' : undefined
  }));

const createProtocol = () => `SERV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;

const normalizeDocumentos = (documentos?: Documento[]) =>
  (documentos ?? []).map((item) => ({
    id: normalizeText(item.id) || crypto.randomUUID(),
    nome: normalizeText(item.nome),
    tipo: normalizeText(item.tipo),
    dataUpload: normalizeText(item.dataUpload) || new Date().toISOString(),
    tamanho: asNumber(item.tamanho),
    fileId: normalizeText(item.fileId) || undefined,
    url: normalizeText(item.url) || undefined
  }));

const normalizePadraoItens = (itens?: PadraoEntradaItem[]) =>
  (itens ?? []).map((item) => ({
    id: normalizeText(item.id) || crypto.randomUUID(),
    tipoLigacao: normalizeText(item.tipoLigacao),
    classificacao: normalizeText(item.classificacao),
    quantidade: asNumber(item.quantidade),
    disjuntor: normalizeText(item.disjuntor)
  }));

const normalizeRateios = (rateios?: DivisaoCreditos[]) =>
  (rateios ?? []).map((item) => ({
    percentual: asNumber(item.percentual),
    uc: normalizeText(item.uc),
    classe: normalizeText(item.classe),
    endereco: normalizeText(item.endereco)
  }));

const normalizeTimeline = (serviceId: string, status: StatusServico, dataAbertura: string, dataAtualizacao: string, timeline?: TimelineItem[]) => {
  if (!timeline || timeline.length === 0) {
    return buildTimeline(serviceId, status, dataAbertura, dataAtualizacao);
  }

  return timeline.map((item) => ({
    id: normalizeText(item.id) || crypto.randomUUID(),
    etapa: normalizeText(item.etapa),
    data: normalizeText(item.data) || dataAtualizacao,
    status: item.status,
    descricao: normalizeText(item.descricao) || undefined
  }));
};

const normalizeServico = (raw: Partial<Servico>): Servico => {
  // Servicos ainda vivem majoritariamente no frontend; essa normalizacao garante consistencia
  // mesmo quando os dados vierem de formularios, edicoes ou armazenamento local.
  const id = normalizeText(raw.id) || crypto.randomUUID();
  const dataCriacao = normalizeText(raw.dataCriacao) || new Date().toISOString();
  const dataAtualizacao = normalizeText(raw.dataAtualizacao) || dataCriacao;
  const status = normalizeStatus(raw.status);
  const dataAbertura = normalizeText(raw.dataAbertura) || dataCriacao.slice(0, 10);
  const valor = asNumber(raw.valor);
  const cupomDescontoPct = asNumber(raw.cupomDescontoPct);
  const valorFinal = Math.max(valor - valor * (cupomDescontoPct / 100), 0);

  return {
    id,
    protocolo: normalizeText(raw.protocolo) || createProtocol(),
    tipo: raw.tipo ?? 'ligacao_nova',
    nome: normalizeText(raw.nome) || SERVICE_TYPE_LABELS[raw.tipo ?? 'ligacao_nova'],
    clienteId: normalizeText(raw.clienteId) || undefined,
    cliente: normalizeText(raw.cliente) || 'Cliente nao informado',
    concessionaria: normalizeText(raw.concessionaria),
    status,
    dataAbertura,
    valor,
    cupomDescontoPct,
    valorFinal,
    observacoes: normalizeText(raw.observacoes) || undefined,
    tensaoFornecimento: raw.tensaoFornecimento,
    coordenadas:
      raw.coordenadas?.latitude && raw.coordenadas?.longitude
        ? { latitude: normalizeText(raw.coordenadas.latitude), longitude: normalizeText(raw.coordenadas.longitude) }
        : undefined,
    pontoReferencia: normalizeText(raw.pontoReferencia) || undefined,
    padraoMaisDe30m: raw.padraoMaisDe30m,
    enderecoObra: cloneEndereco(raw.enderecoObra),
    ucGeradora: normalizeText(raw.ucGeradora) || undefined,
    enderecoGeradora: cloneEndereco(raw.enderecoGeradora),
    padraoEntradaItens: normalizePadraoItens(raw.padraoEntradaItens),
    rateios: normalizeRateios(raw.rateios),
    documentos: normalizeDocumentos(raw.documentos),
    timeline: normalizeTimeline(id, status, dataAbertura, dataAtualizacao, raw.timeline),
    dataCriacao,
    dataAtualizacao
  };
};

const readStorage = (): Servico[] =>
  servicosStorage.read().map(normalizeServico);

const writeStorage = (items: Servico[]) => servicosStorage.write(items);

const sortByDate = (items: Servico[]) =>
  [...items].sort((left, right) => new Date(right.dataCriacao).getTime() - new Date(left.dataCriacao).getTime());

export const servicosService = {
  statusFlow: SERVICE_STATUS_FLOW,
  typeLabels: SERVICE_TYPE_LABELS,

  async saveDocuments(id: string, documentos: Documento[]): Promise<Servico> {
    // Mantem o mesmo ponto de entrada para anexos independentemente de o servico ter sido criado
    // pela tela nova ou pelo fluxo legado baseado em localStorage.
    return servicosService.update(id, { documentos });
  },

  async list(): Promise<Servico[]> {
    return sortByDate(readStorage());
  },

  async getById(id: string): Promise<Servico> {
    const item = readStorage().find((service) => service.id === id);
    if (!item) {
      throw new Error('Servico nao encontrado.');
    }

    return item;
  },

  async create(payload: CreateServicoPayload): Promise<Servico> {
    const now = new Date().toISOString();
    const item = normalizeServico({
      id: crypto.randomUUID(),
      protocolo: createProtocol(),
      tipo: payload.tipo,
      nome: SERVICE_TYPE_LABELS[payload.tipo],
      clienteId: payload.clienteId,
      cliente: payload.cliente,
      concessionaria: payload.concessionaria,
      status: 'abertura_servico',
      dataAbertura: payload.dataAbertura,
      valor: payload.valor,
      cupomDescontoPct: payload.cupomDescontoPct ?? 0,
      observacoes: payload.observacoes,
      tensaoFornecimento: payload.tensaoFornecimento,
      coordenadas: payload.coordenadas,
      pontoReferencia: payload.pontoReferencia,
      padraoMaisDe30m: payload.padraoMaisDe30m,
      enderecoObra: payload.enderecoObra,
      ucGeradora: payload.ucGeradora,
      enderecoGeradora: payload.enderecoGeradora,
      padraoEntradaItens: payload.padraoEntradaItens,
      rateios: payload.rateios,
      documentos: payload.documentos,
      dataCriacao: now,
      dataAtualizacao: now
    });

    const current = readStorage();
    writeStorage([item, ...current]);
    approvalsService.createForNonAdmin({
      entityType: 'servico',
      entityId: item.id,
      entityLabel: item.protocolo,
      clientName: item.cliente
    });
    return item;
  },

  async update(id: string, payload: UpdateServicoPayload): Promise<Servico> {
    const current = readStorage();
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error('Servico nao encontrado.');
    }

    const nextStatus = payload.status ?? current[index].status;
    const nextUpdatedAt = new Date().toISOString();
    const updated = normalizeServico({
      ...current[index],
      ...payload,
      id,
      status: nextStatus,
      timeline: payload.timeline ?? buildTimeline(id, nextStatus, current[index].dataAbertura, nextUpdatedAt),
      nome: payload.tipo ? SERVICE_TYPE_LABELS[payload.tipo] : current[index].nome,
      dataAtualizacao: nextUpdatedAt
    });
    current[index] = updated;
    writeStorage(current);
    return updated;
  },

  async updateStatus(id: string, status: StatusServico): Promise<Servico> {
    const current = readStorage();
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) {
      throw new Error('Servico nao encontrado.');
    }

    const currentItem = current[index];
    const updated = normalizeServico({
      ...currentItem,
      status,
      timeline: buildTimeline(currentItem.id, status, currentItem.dataAbertura, new Date().toISOString()),
      dataAtualizacao: new Date().toISOString()
    });
    current[index] = updated;
    writeStorage(current);
    return updated;
  }
};
