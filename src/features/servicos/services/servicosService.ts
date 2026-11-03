/** Camada de acesso a dados para 'servicosService': integra a API e preserva no frontend apenas os campos ainda nao suportados pelo backend. */
import type {
  Documento,
  DivisaoCreditos,
  Endereco,
  PadraoEntradaItem,
  Servico,
  StatusServico,
  StatusAprovacaoServico,
  TimelineItem,
  TipoServico,
} from '@/types';
import { parseCoordinate } from '@/core/utils/masks';
import { asNumber, asString, isRecord } from '@/core/utils/normalize';
import { createRecordStorage } from '@/core/utils/storage';
import { addressService } from '@/shared/api/addressService';
import { apiClient } from '@/shared/api/apiClient';
import { createRequestCache } from '@/shared/api/requestCache';
import { filesService } from '@/shared/api/filesService';
import { concessionairesService } from '@/features/concessionaries/services/concessionairesService';
import { customersService } from '@/features/clientes/services/customersService';
import { getSessionUser } from '@/shared/session/sessionUser';
import { getAllPages } from '@/shared/api/pagination';
import { clearAllRequestCaches } from '@/shared/api/requestCache';

export interface CreateServicoPayload {
  subsequencia?: string;
  tipo: TipoServico;
  cliente: string;
  clienteId?: string;
  integradorId?: string;
  integradorNome?: string;
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

type RawServiceRecord = Record<string, unknown>;

export interface ServiceListOptions {
  includeAddresses?: boolean;
}

type ServiceEnhancement = {
  protocolo?: string;
  status?: StatusServico;
  timeline?: TimelineItem[];
  documentos?: Documento[];
  pontoReferencia?: string;
  clienteNome?: string;
  concessionariaNome?: string;
  precisaAprovacao?: boolean;
  integradorId?: string;
  integradorNome?: string;
};

type DocumentCategories = Record<string, string>;

const serviceEnhancementStorage = createRecordStorage<ServiceEnhancement>(
  'opj_frontend_service_enhancements',
);
const fullServicesListCache = createRequestCache<Servico[]>(30_000);
const lightweightServicesListCache = createRequestCache<Servico[]>(30_000);

const invalidateServicesListCaches = () => {
  fullServicesListCache.invalidate();
  lightweightServicesListCache.invalidate();
};

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string' || !value.trim()) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const serializeJson = (value: unknown) => JSON.stringify(value);

const SERVICE_STATUS_FLOW: Array<{ status: StatusServico; etapa: string }> = [
  { status: 'aguardando_aprovacao', etapa: 'Aguardando Aprovação' },
  { status: 'abertura_servico', etapa: 'Abertura do Serviço' },
  { status: 'elaboracao_documentacao', etapa: 'Elaboração da Documentação' },
  { status: 'aguardando_assinatura_cliente', etapa: 'Aguardando Assinatura do Cliente' },
  {
    status: 'aguardando_protocolo_concessionaria',
    etapa: 'Aguardando Protocolo da Concessionária',
  },
  { status: 'em_analise_concessionaria', etapa: 'Em Análise na Concessionária' },
  { status: 'ressalvas', etapa: 'Ressalvas' },
  { status: 'obras_concessionaria', etapa: 'Obras da Concessionária' },
  { status: 'servico_aprovado', etapa: 'Serviço Aprovado' },
  { status: 'vistoria_solicitada', etapa: 'Vistoria Solicitada' },
  { status: 'vistoria_reprovada', etapa: 'Vistoria Reprovada' },
  { status: 'servico_encerrado', etapa: 'Serviço Encerrado' },
];

const SERVICE_TYPE_LABELS: Record<TipoServico, string> = {
  ligacao_nova: 'Ligação Nova',
  aumento_carga: 'Aumento de Carga',
  troca_titularidade: 'Troca de Titularidade',
  alteracao_compartilhamento_credito: 'Alteração no Compartilhamento de Crédito',
};

const normalizeText = (value?: string) => value?.trim() ?? '';

const normalizeServiceType = (value: unknown): TipoServico => {
  const normalized = asString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  const aliases: Record<string, TipoServico> = {
    ligacao_nova: 'ligacao_nova',
    aumento_carga: 'aumento_carga',
    aumento_de_carga: 'aumento_carga',
    troca_titularidade: 'troca_titularidade',
    troca_de_titularidade: 'troca_titularidade',
    alteracao_compartilhamento_credito: 'alteracao_compartilhamento_credito',
    alteracao_no_compartilhamento_de_credito: 'alteracao_compartilhamento_credito',
  };

  return aliases[normalized] ?? 'ligacao_nova';
};

const cloneEndereco = (endereco?: Endereco | null): Endereco | undefined =>
  endereco
    ? {
        cep: normalizeText(endereco.cep),
        logradouro: normalizeText(endereco.logradouro),
        numero: normalizeText(endereco.numero),
        complemento: normalizeText(endereco.complemento),
        bairro: normalizeText(endereco.bairro),
        cidade: normalizeText(endereco.cidade),
        estado: normalizeText(endereco.estado),
        link: normalizeText(endereco.link) || undefined,
      }
    : undefined;

const normalizeStatus = (value?: string): StatusServico => {
  const normalized = normalizeText(value).toLowerCase();
  const found = SERVICE_STATUS_FLOW.find((item) => item.status === normalized);
  return found?.status ?? 'abertura_servico';
};

const getTimelineStageLabel = (status: StatusServico) =>
  SERVICE_STATUS_FLOW.find((item) => item.status === status)?.etapa ?? status;

const getRecordedTimelineStatus = (status: StatusServico): TimelineItem['status'] =>
  status === 'servico_aprovado' || status === 'servico_encerrado' ? 'concluido' : 'em_andamento';

const buildTimelineEntry = (
  service: Pick<Servico, 'id' | 'protocolo' | 'dataAbertura' | 'dataCriacao'>,
  status: StatusServico,
  descricaoAtual?: string,
  data?: string,
): TimelineItem => ({
  id: crypto.randomUUID(),
  etapa: getTimelineStageLabel(status),
  data: data || new Date().toISOString(),
  status: getRecordedTimelineStatus(status),
  descricao: descricaoAtual || `Status atual do serviço ${service.protocolo}.`,
  comentarios: [],
});

const appendTimelineEntryForServiceStatus = (
  service: Pick<Servico, 'id' | 'protocolo' | 'dataAbertura' | 'dataCriacao'>,
  currentTimeline: TimelineItem[],
  status: StatusServico,
  descricaoAtual?: string,
): TimelineItem[] => {
  const previousTimeline = currentTimeline.map((item, index, array) =>
    index === array.length - 1 && item.status === 'em_andamento'
      ? { ...item, status: 'concluido' as const }
      : item,
  );

  return [...previousTimeline, buildTimelineEntry(service, status, descricaoAtual)];
};

const buildTimeline = (
  id: string,
  status: StatusServico,
  dataAbertura: string,
  dataAtualizacao: string,
): TimelineItem[] => [
  buildTimelineEntry(
    {
      id,
      protocolo: id,
      dataAbertura,
      dataCriacao: dataAtualizacao,
    },
    status,
    'Etapa atual do serviço.',
    dataAtualizacao || dataAbertura,
  ),
];

const createProtocol = () => `SERV-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
const buildStableProtocol = (id: string, createdAt: string) => {
  const year = new Date(createdAt).getFullYear();
  const suffix = id.replace(/-/g, '').slice(0, 5).toUpperCase();
  return `SERV-${year}-${suffix}`;
};

const normalizeDocumentos = (documentos?: Documento[]) =>
  (documentos ?? []).map((item) => ({
    id: normalizeText(item.id) || crypto.randomUUID(),
    nome: normalizeText(item.nome),
    tipo: normalizeText(item.tipo),
    dataUpload: normalizeText(item.dataUpload) || new Date().toISOString(),
    tamanho: asNumber(item.tamanho),
    fileId: normalizeText(item.fileId) || undefined,
    url: normalizeText(item.url) || undefined,
  }));

const buildBackendDocument = (
  documento: { id: string; fileName: string; urlS3: string; size: number; createdAt?: string },
  current?: Documento,
): Documento => ({
  id: documento.id,
  fileId: documento.id,
  nome: documento.fileName,
  tipo: current?.tipo || 'Documento',
  dataUpload: current?.dataUpload || documento.createdAt || new Date().toISOString(),
  tamanho: documento.size,
  url: documento.urlS3 || current?.url,
});

const normalizePadraoItens = (itens?: PadraoEntradaItem[]) =>
  (itens ?? []).map((item) => ({
    id: normalizeText(item.id) || crypto.randomUUID(),
    tipoLigacao: normalizeText(item.tipoLigacao),
    classificacao: normalizeText(item.classificacao),
    quantidade: asNumber(item.quantidade),
    disjuntor: normalizeText(item.disjuntor),
  }));

const normalizeRateios = (rateios?: DivisaoCreditos[]) =>
  (rateios ?? []).map((item) => ({
    percentual: asNumber(item.percentual),
    uc: normalizeText(item.uc),
    classe: normalizeText(item.classe),
    endereco: normalizeText(item.endereco),
  }));

const normalizeTimeline = (
  serviceId: string,
  status: StatusServico,
  dataAbertura: string,
  dataAtualizacao: string,
  timeline?: TimelineItem[],
) => {
  if (!timeline || timeline.length === 0) {
    return buildTimeline(serviceId, status, dataAbertura, dataAtualizacao);
  }

  const normalizedTimeline = timeline.map((item) => ({
    id: normalizeText(item.id) || crypto.randomUUID(),
    etapa: normalizeText(item.etapa),
    data: normalizeText(item.data) || dataAtualizacao,
    status: item.status,
    descricao: normalizeText(item.descricao) || undefined,
    comentarios: item.comentarios,
  }));

  const isGeneratedFullFlow =
    normalizedTimeline.length === SERVICE_STATUS_FLOW.length &&
    SERVICE_STATUS_FLOW.every((flowItem) =>
      normalizedTimeline.some((item) => item.id === `${serviceId}-${flowItem.status}`),
    );

  return isGeneratedFullFlow
    ? buildTimeline(serviceId, status, dataAbertura, dataAtualizacao)
    : normalizedTimeline;
};

const deserializeTimeline = (
  serviceId: string,
  status: StatusServico,
  dataAbertura: string,
  dataAtualizacao: string,
  rawTimeline: unknown,
  rawComments: unknown,
  fallback?: TimelineItem[],
) => {
  const timeline = parseJson<TimelineItem[] | null>(rawTimeline, null);
  if (!Array.isArray(timeline)) {
    return normalizeTimeline(serviceId, status, dataAbertura, dataAtualizacao, fallback);
  }

  const comments = parseJson<Record<string, TimelineItem['comentarios']>>(rawComments, {});

  return normalizeTimeline(
    serviceId,
    status,
    dataAbertura,
    dataAtualizacao,
    timeline.map((item) => ({
      ...item,
      comentarios: comments[item.id] ?? item.comentarios ?? [],
    })),
  );
};

const serializeTimeline = (timeline: TimelineItem[]) => ({
  timeline: serializeJson(
    timeline.map((item) => ({
      id: item.id,
      etapa: item.etapa,
      data: item.data,
      status: item.status,
      descricao: item.descricao,
    })),
  ),
  timeline_comments: serializeJson(
    Object.fromEntries(
      timeline
        .filter((item) => item.comentarios?.length)
        .map((item) => [item.id, item.comentarios]),
    ),
  ),
});

const normalizeApprovalStatus = (
  value: unknown,
  fallback: StatusAprovacaoServico = 'not_required',
): StatusAprovacaoServico => {
  const normalized = asString(value).toLowerCase();
  if (['pending', 'pendente', 'aguardando_aprovacao'].includes(normalized)) return 'pending';
  if (['approved', 'aprovado'].includes(normalized)) return 'approved';
  if (['rejected', 'rejeitado'].includes(normalized)) return 'rejected';
  if (normalized === 'not_required') return 'not_required';
  return fallback;
};

const serializeDocumentMetadata = (documentos: Documento[], reusedDocumentIds: string[]) => ({
  document_category: serializeJson(
    Object.fromEntries(
      documentos.map((documento) => [documento.fileId || documento.id, documento.tipo]),
    ),
  ),
  reused_documents: serializeJson(reusedDocumentIds),
});

const buildTimelineFromStatus = (
  serviceId: string,
  status: StatusServico,
  dataAbertura: string,
  dataAtualizacao: string,
) => normalizeTimeline(serviceId, status, dataAbertura, dataAtualizacao, undefined);

const normalizeCoordinates = (value: unknown): Servico['coordenadas'] | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const latitude =
    typeof value.latitude === 'number' ? String(value.latitude) : asString(value.latitude);
  const longitude =
    typeof value.longitude === 'number' ? String(value.longitude) : asString(value.longitude);
  if (!latitude || !longitude) {
    return undefined;
  }

  return { latitude, longitude };
};

const updateServiceEnhancement = (
  serviceId: string,
  updater: (current: ServiceEnhancement | undefined) => ServiceEnhancement,
) => {
  const current = serviceEnhancementStorage.read();
  current[serviceId] = updater(current[serviceId]);
  serviceEnhancementStorage.write(current);
};

const buildServiceEnhancement = (
  payload: CreateServicoPayload,
  serviceId: string,
): ServiceEnhancement => {
  const sessionUser = getSessionUser();
  const precisaAprovacao = sessionUser ? !sessionUser.isAdmin : false;
  const initialStatus: StatusServico = precisaAprovacao
    ? 'aguardando_aprovacao'
    : 'abertura_servico';
  const now = new Date().toISOString();

  return {
    protocolo: createProtocol(),
    status: initialStatus,
    timeline: buildTimelineFromStatus(serviceId, initialStatus, payload.dataAbertura, now),
    documentos: normalizeDocumentos(payload.documentos),
    pontoReferencia: normalizeText(payload.pontoReferencia) || undefined,
    clienteNome: normalizeText(payload.cliente) || undefined,
    concessionariaNome: normalizeText(payload.concessionaria) || undefined,
    integradorId: normalizeText(payload.integradorId) || undefined,
    integradorNome: normalizeText(payload.integradorNome) || undefined,
    precisaAprovacao,
  };
};

const normalizeServiceFromApi = (
  raw: unknown,
  refs: {
    customerNamesById: Map<string, string>;
    concessionaireNamesById: Map<string, string>;
    addressesById: Map<string, Endereco>;
    documentsByServiceId?: Map<string, Documento[]>;
  },
): Servico => {
  const service = isRecord(raw) ? raw : {};
  const id = asString(service.id) || crypto.randomUUID();
  const dataCriacao = asString(service.created_at) || new Date().toISOString();
  const dataAtualizacao = asString(service.updated_at) || dataCriacao;
  const enhancement = serviceEnhancementStorage.read()[id];
  const status = normalizeStatus(asString(service.status) || enhancement?.status);
  const dataAbertura = asString(service.opening_date) || dataCriacao.slice(0, 10);
  const valor = asNumber(service.amount);
  const cupomDescontoPct = asNumber(service.discount_coupon_percentage);
  const valorFinal = Math.max(valor - valor * (cupomDescontoPct / 100), 0);
  const customerId = asString(service.customer_id) || undefined;
  const concessionariaId = asString(service.concessionaire_id) || undefined;
  const createdBy = asString(service.created_by) || undefined;
  const protocolo =
    asString(service.protocol) || enhancement?.protocolo || buildStableProtocol(id, dataCriacao);
  const documentCategories = parseJson<DocumentCategories>(service.document_category, {});
  const tipo = normalizeServiceType(service.service_type);
  const documentos = (
    refs.documentsByServiceId?.get(id) ?? normalizeDocumentos(enhancement?.documentos)
  ).map((documento) => ({
    ...documento,
    tipo: documentCategories[documento.fileId || documento.id] || documento.tipo,
  }));

  return {
    id,
    protocolo,
    subsequencia: asString(service.subsequence) || undefined,
    tipo,
    nome: SERVICE_TYPE_LABELS[tipo],
    clienteId: customerId,
    concessionariaId: concessionariaId,
    cliente:
      enhancement?.clienteNome ||
      refs.customerNamesById.get(customerId ?? '') ||
      'Cliente não informado',
    concessionaria:
      enhancement?.concessionariaNome ||
      refs.concessionaireNamesById.get(concessionariaId ?? '') ||
      'Concessionária não informada',
    status,
    dataAbertura,
    valor,
    cupomDescontoPct,
    valorFinal,
    observacoes: asString(service.observations) || undefined,
    tensaoFornecimento:
      (asString(service.supply_voltage) as Servico['tensaoFornecimento']) || undefined,
    coordenadas: normalizeCoordinates(service.coordinates),
    pontoReferencia: asString(service.reference_point) || enhancement?.pontoReferencia || undefined,
    padraoMaisDe30m:
      service.pole_distance_over_30m === true
        ? 'sim'
        : service.pole_distance_over_30m === false
          ? 'nao'
          : undefined,
    enderecoObra: cloneEndereco(refs.addressesById.get(asString(service.construction_address_id))),
    ucGeradora: asString(service.generating_consumer_unit) || undefined,
    enderecoGeradora: cloneEndereco(
      refs.addressesById.get(asString(service.generating_address_id)),
    ),
    padraoEntradaItens: normalizePadraoItens(
      Array.isArray(service.service_entry_items)
        ? service.service_entry_items.map((item) => {
            const normalized = isRecord(item) ? item : {};
            return {
              id: asString(normalized.id),
              tipoLigacao: asString(normalized.connection_type),
              classificacao: asString(normalized.classification),
              quantidade: asNumber(normalized.quantity),
              disjuntor: asString(normalized.circuit_breaker),
            };
          })
        : [],
    ),
    rateios: normalizeRateios(
      Array.isArray(service.apportionments)
        ? service.apportionments.map((item) => {
            const normalized = isRecord(item) ? item : {};
            return {
              uc: asString(normalized.consumer_unit),
              endereco: asString(normalized.address),
              classe: asString(normalized.classification),
              percentual: asNumber(normalized.percentage),
            };
          })
        : [],
    ),
    documentos,
    timeline: deserializeTimeline(
      id,
      status,
      dataAbertura,
      dataAtualizacao,
      service.timeline,
      service.timeline_comments,
      enhancement?.timeline,
    ),
    approvalStatus: normalizeApprovalStatus(
      service.approval_status,
      enhancement?.precisaAprovacao ? 'pending' : 'not_required',
    ),
    precisaAprovacao:
      normalizeApprovalStatus(
        service.approval_status,
        enhancement?.precisaAprovacao ? 'pending' : 'not_required',
      ) === 'pending',
    integradorId:
      asString(service.integrator_id) ||
      asString(service.integrator) ||
      enhancement?.integradorId ||
      createdBy ||
      undefined,
    integradorNome: asString(service.integrator_name) || enhancement?.integradorNome || undefined,
    createdBy,
    updatedBy: asString(service.updated_by) || undefined,
    dataCriacao,
    dataAtualizacao,
  };
};

const sortByDate = (items: Servico[]) =>
  [...items].sort(
    (left, right) => new Date(right.dataCriacao).getTime() - new Date(left.dataCriacao).getTime(),
  );

const buildPointWkt = (coordinates?: CreateServicoPayload['coordenadas']) => {
  if (!coordinates?.latitude || !coordinates?.longitude) {
    return undefined;
  }

  const latitude = parseCoordinate(coordinates.latitude);
  const longitude = parseCoordinate(coordinates.longitude);

  if (latitude === null || longitude === null) {
    return undefined;
  }

  return `POINT(${longitude} ${latitude})`;
};

const toAddressPayload = (endereco?: Endereco) => {
  if (!endereco) {
    return undefined;
  }

  return {
    cep: normalizeText(endereco.cep),
    place: normalizeText(endereco.logradouro),
    number: normalizeText(endereco.numero),
    address: normalizeText(endereco.logradouro),
    complement: normalizeText(endereco.complemento),
    neighborhood: normalizeText(endereco.bairro),
    city: normalizeText(endereco.cidade),
    state: normalizeText(endereco.estado).toLowerCase(),
    link: normalizeText(endereco.link),
  };
};

const loadReferenceData = async (records: RawServiceRecord[], options: ServiceListOptions = {}) => {
  const [customers, concessionarias] = await Promise.all([
    customersService.getAll().catch(() => []),
    concessionairesService.getAll().catch(() => []),
  ]);

  const addressIds =
    options.includeAddresses === false
      ? []
      : Array.from(
          new Set(
            records
              .flatMap((record) => [
                asString(record.construction_address_id),
                asString(record.generating_address_id),
              ])
              .filter(Boolean),
          ),
        );

  const addresses = await Promise.all(
    addressIds.map(async (addressId) => {
      try {
        const address = await addressService.getById(addressId);
        return {
          id: address.id,
          endereco: {
            cep: address.cep,
            logradouro: address.address || address.place,
            numero: address.number,
            complemento: address.complement || '',
            bairro: address.neighborhood,
            cidade: address.city,
            estado: address.state.toUpperCase(),
            link: address.link,
          } satisfies Endereco,
        };
      } catch {
        return null;
      }
    }),
  );

  return {
    customerNamesById: new Map(customers.map((customer) => [customer.id, customer.nome])),
    concessionaireNamesById: new Map(concessionarias.map((item) => [item.id, item.name])),
    addressesById: new Map(
      addresses.filter((item) => item !== null).map((item) => [item.id, item.endereco] as const),
    ),
  };
};

const resolveCustomerId = async (payload: Pick<CreateServicoPayload, 'clienteId' | 'cliente'>) => {
  if (payload.clienteId) {
    return payload.clienteId;
  }

  const customerName = normalizeText(payload.cliente).toLowerCase();
  if (!customerName) {
    throw new Error('Selecione um cliente cadastrado para salvar o serviço na API.');
  }

  const customers = await customersService.getAll();
  const matched = customers.find((item) => item.nome.trim().toLowerCase() === customerName);
  if (!matched) {
    throw new Error(
      'O backend exige um cliente cadastrado. Selecione um cliente existente para continuar.',
    );
  }

  return matched.id;
};

const resolveConcessionaireId = async (concessionaria: string) => {
  const normalizedTarget = normalizeText(concessionaria).toLowerCase();
  const concessionarias = await concessionairesService.getAll();
  const matched = concessionarias.find(
    (item) => item.id === concessionaria || item.name.trim().toLowerCase() === normalizedTarget,
  );

  if (!matched) {
    throw new Error('Selecione uma concessionária válida para salvar o serviço na API.');
  }

  return matched.id;
};

const persistAddress = async (currentAddressId: string | undefined, endereco?: Endereco) => {
  const payload = toAddressPayload(endereco);
  if (!payload) {
    return undefined;
  }

  if (currentAddressId) {
    const updated = await addressService.update({
      id: currentAddressId,
      ...payload,
    });
    return updated.id;
  }

  const created = await addressService.create(payload);
  return created.id;
};

const buildApiPayload = async (
  payload: CreateServicoPayload | UpdateServicoPayload,
  current?: RawServiceRecord,
  trackingFields: Record<string, unknown> = {},
) => {
  const customerId =
    payload.clienteId !== undefined || payload.cliente !== undefined
      ? await resolveCustomerId({
          clienteId: payload.clienteId,
          cliente: payload.cliente ?? '',
        })
      : asString(current?.customer_id);
  const concessionaireId =
    payload.concessionaria !== undefined
      ? await resolveConcessionaireId(payload.concessionaria)
      : asString(current?.concessionaire_id);
  const constructionAddressId =
    payload.enderecoObra !== undefined
      ? await persistAddress(
          asString(current?.construction_address_id) || undefined,
          payload.enderecoObra,
        )
      : asString(current?.construction_address_id) || undefined;
  const generatingAddressId =
    payload.enderecoGeradora !== undefined
      ? await persistAddress(
          asString(current?.generating_address_id) || undefined,
          payload.enderecoGeradora,
        )
      : asString(current?.generating_address_id) || undefined;

  return {
    service_type: payload.tipo ?? asString(current?.service_type),
    subsequence:
      payload.subsequencia !== undefined
        ? payload.subsequencia.trim() || null
        : current?.subsequence,
    integrator: payload.integradorId ?? current?.integrator,
    customer_id: customerId,
    concessionaire_id: concessionaireId,
    opening_date: payload.dataAbertura ?? asString(current?.opening_date),
    amount: payload.valor ?? current?.amount,
    discount_coupon_percentage:
      payload.cupomDescontoPct ?? current?.discount_coupon_percentage ?? 0,
    observations: payload.observacoes ?? asString(current?.observations),
    supply_voltage: payload.tensaoFornecimento ?? asString(current?.supply_voltage),
    coordinates:
      payload.coordenadas !== undefined ? buildPointWkt(payload.coordenadas) : current?.coordinates,
    generating_consumer_unit: payload.ucGeradora ?? asString(current?.generating_consumer_unit),
    pole_distance_over_30m:
      payload.padraoMaisDe30m !== undefined
        ? payload.padraoMaisDe30m === 'sim'
        : current?.pole_distance_over_30m,
    construction_address_id: constructionAddressId,
    generating_address_id: generatingAddressId,
    apportionments_attributes:
      payload.rateios !== undefined
        ? normalizeRateios(payload.rateios).map((item) => ({
            consumer_unit: item.uc,
            address: item.endereco,
            classification: item.classe,
            percentage: item.percentual,
          }))
        : Array.isArray(current?.apportionments)
          ? undefined
          : [],
    service_entry_items_attributes:
      payload.padraoEntradaItens !== undefined
        ? normalizePadraoItens(payload.padraoEntradaItens).map((item) => ({
            connection_type: item.tipoLigacao,
            classification: item.classificacao,
            quantity: item.quantidade,
            circuit_breaker: item.disjuntor,
          }))
        : Array.isArray(current?.service_entry_items)
          ? undefined
          : [],
    ...trackingFields,
  };
};

const getServiceRaw = async (id: string): Promise<RawServiceRecord> => {
  const response = await apiClient.get<unknown>(`/services/${id}`);
  return isRecord(response) ? response : {};
};

export const servicosService = {
  async updateIdentifier(id: string, protocol: string, subsequence: string): Promise<Servico> {
    await apiClient.patch(`/services/${id}`, {
      protocol: protocol.trim(),
      subsequence: subsequence || null,
    });
    invalidateServicesListCaches();
    updateServiceEnhancement(id, (current) => ({ ...current, protocolo: protocol.trim() }));
    return servicosService.getById(id);
  },
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/services/${id}`);
    const enhancements = serviceEnhancementStorage.read();
    delete enhancements[id];
    serviceEnhancementStorage.write(enhancements);
    clearAllRequestCaches();
  },

  async removeDirectDocuments(id: string): Promise<Servico> {
    const service = await servicosService.getById(id);
    const direct = await filesService.listByItem(id);
    await filesService.removeByItem(id);
    const remaining = await filesService.listByItem(id);
    const removed = new Set(
      direct
        .filter((file) => !remaining.some((item) => item.id === file.id))
        .map((file) => file.id),
    );
    return servicosService.saveDocuments(
      id,
      service.documentos.filter((doc) => !removed.has(doc.fileId || doc.id)),
    );
  },

  async removeDocument(id: string, fileId: string): Promise<Servico> {
    const service = await servicosService.getById(id);
    const direct = await filesService.listByItem(id);
    if (direct.some((file) => file.id === fileId)) await filesService.remove(fileId);
    const remaining = service.documentos.filter((doc) => (doc.fileId || doc.id) !== fileId);
    return servicosService.saveDocuments(id, remaining);
  },
  statusFlow: SERVICE_STATUS_FLOW,
  typeLabels: SERVICE_TYPE_LABELS,

  async saveDocuments(id: string, documentos: Documento[]): Promise<Servico> {
    const directUploads = await filesService.listByItem(id);
    const directUploadIds = new Set(directUploads.map((documento) => documento.id));
    const reusedDocumentIds = documentos
      .map((documento) => documento.fileId || documento.id)
      .filter((documentId) => !directUploadIds.has(documentId));

    await apiClient.put<unknown>(
      `/services/${id}`,
      serializeDocumentMetadata(normalizeDocumentos(documentos), reusedDocumentIds),
    );
    invalidateServicesListCaches();

    // Compatibilidade temporaria com servicos criados antes dos novos campos da API.
    updateServiceEnhancement(id, (current) => ({
      ...current,
      documentos: normalizeDocumentos(documentos),
    }));

    return servicosService.getById(id);
  },

  async list(options: ServiceListOptions = {}): Promise<Servico[]> {
    const cache =
      options.includeAddresses === false ? lightweightServicesListCache : fullServicesListCache;

    return cache.get(async () => {
      const response = await getAllPages<unknown>('/services');
      const records = Array.isArray(response)
        ? response.map((item) => (isRecord(item) ? item : {}))
        : [];
      const refs = await loadReferenceData(records, options);

      return sortByDate(records.map((record) => normalizeServiceFromApi(record, refs)));
    });
  },

  async getById(id: string): Promise<Servico> {
    const raw = await getServiceRaw(id);
    const customerId = asString(raw.customer_id);
    const reusedDocumentIds = parseJson<string[]>(raw.reused_documents, []);
    const [refs, uploads, customerUploads] = await Promise.all([
      loadReferenceData([raw]),
      filesService.listByItem(id).catch(() => []),
      customerId && reusedDocumentIds.length > 0
        ? filesService.listByItem(customerId).catch(() => [])
        : Promise.resolve([]),
    ]);
    const currentDocuments = serviceEnhancementStorage.read()[id]?.documentos ?? [];
    const reusedDocumentIdSet = new Set(reusedDocumentIds);
    const backendDocuments = [
      ...uploads,
      ...customerUploads.filter((item) => reusedDocumentIdSet.has(item.id)),
    ];
    const documents =
      backendDocuments.length > 0
        ? backendDocuments.map((item) =>
            buildBackendDocument(
              item,
              currentDocuments.find((documento) => (documento.fileId || documento.id) === item.id),
            ),
          )
        : normalizeDocumentos(currentDocuments);
    const documentsByServiceId = new Map<string, Documento[]>([[id, documents]]);

    return normalizeServiceFromApi(raw, { ...refs, documentsByServiceId });
  },

  async create(payload: CreateServicoPayload): Promise<Servico> {
    const temporaryId = crypto.randomUUID();
    const enhancement = buildServiceEnhancement(payload, temporaryId);
    const apiPayload = await buildApiPayload(payload, undefined, {
      protocol: enhancement.protocolo,
      status: enhancement.status,
      ...serializeTimeline(enhancement.timeline ?? []),
      reference_point: enhancement.pontoReferencia,
      approval_status: enhancement.precisaAprovacao ? 'pending' : 'not_required',
      ...serializeDocumentMetadata(enhancement.documentos ?? [], []),
    });
    const response = await apiClient.post<unknown>('/services', apiPayload);
    invalidateServicesListCaches();
    const raw = isRecord(response) ? response : {};
    const serviceId = asString(raw.id) || crypto.randomUUID();

    updateServiceEnhancement(serviceId, (current) => ({
      ...current,
      ...enhancement,
    }));

    const createdService = await servicosService.getById(serviceId);
    if (!createdService.precisaAprovacao) {
      return createdService;
    }

    return createdService;
  },

  async approvePending(
    id: string,
    nextStatus: StatusServico = 'abertura_servico',
  ): Promise<Servico> {
    const currentService = await servicosService.getById(id);
    const nextTimeline = appendTimelineEntryForServiceStatus(
      currentService,
      currentService.timeline,
      nextStatus,
      'Serviço aprovado no frontend e liberado para o fluxo operacional.',
    );

    await apiClient.put<unknown>(`/services/${id}`, {
      protocol: currentService.protocolo,
      status: nextStatus,
      approval_status: 'approved',
      reference_point: currentService.pontoReferencia,
      ...serializeTimeline(nextTimeline),
    });
    invalidateServicesListCaches();

    updateServiceEnhancement(id, (current) => ({
      ...current,
      status: nextStatus,
      timeline: nextTimeline,
      precisaAprovacao: false,
    }));

    return servicosService.getById(id);
  },

  async rejectPending(id: string): Promise<Servico> {
    const currentService = await servicosService.getById(id);
    const nextStatus: StatusServico = 'servico_encerrado';
    const nextTimeline = appendTimelineEntryForServiceStatus(
      currentService,
      currentService.timeline,
      nextStatus,
      'Solicitação rejeitada na tela de aprovações.',
    );

    await apiClient.put<unknown>(`/services/${id}`, {
      protocol: currentService.protocolo,
      status: nextStatus,
      approval_status: 'rejected',
      reference_point: currentService.pontoReferencia,
      ...serializeTimeline(nextTimeline),
    });
    invalidateServicesListCaches();

    updateServiceEnhancement(id, (current) => ({
      ...current,
      status: nextStatus,
      timeline: nextTimeline,
      precisaAprovacao: false,
    }));

    return servicosService.getById(id);
  },

  async update(id: string, payload: UpdateServicoPayload): Promise<Servico> {
    const currentRaw = await getServiceRaw(id);
    const currentService = await servicosService.getById(id);
    const nextStatus = payload.status ?? currentService.status;
    const nextUpdatedAt = new Date().toISOString();
    const nextTimeline =
      payload.timeline ??
      (payload.status && payload.status !== currentService.status
        ? appendTimelineEntryForServiceStatus(
            currentService,
            currentService.timeline,
            nextStatus,
            payload.observacoes,
          )
        : currentService.timeline.length > 0
          ? currentService.timeline
          : buildTimeline(id, nextStatus, currentService.dataAbertura, nextUpdatedAt));

    const apiPayload = await buildApiPayload(payload, currentRaw, {
      protocol: currentService.protocolo,
      status: nextStatus,
      approval_status: currentService.approvalStatus,
      ...serializeTimeline(nextTimeline),
      reference_point:
        payload.pontoReferencia !== undefined
          ? normalizeText(payload.pontoReferencia) || null
          : currentRaw.reference_point,
    });
    await apiClient.put<unknown>(`/services/${id}`, apiPayload);
    invalidateServicesListCaches();

    updateServiceEnhancement(id, (current) => ({
      ...current,
      status: nextStatus,
      timeline: nextTimeline,
      documentos: payload.documentos
        ? normalizeDocumentos(payload.documentos)
        : current?.documentos,
      pontoReferencia:
        payload.pontoReferencia !== undefined
          ? normalizeText(payload.pontoReferencia) || undefined
          : current?.pontoReferencia,
      clienteNome:
        payload.cliente !== undefined
          ? normalizeText(payload.cliente) || undefined
          : current?.clienteNome,
      concessionariaNome:
        payload.concessionaria !== undefined
          ? normalizeText(payload.concessionaria) || undefined
          : current?.concessionariaNome,
    }));

    return servicosService.getById(id);
  },

  async updateStatus(id: string, status: StatusServico): Promise<Servico> {
    const currentService = await servicosService.getById(id);
    const nextTimeline = appendTimelineEntryForServiceStatus(
      currentService,
      currentService.timeline,
      status,
    );

    await apiClient.put<unknown>(`/services/${id}`, {
      protocol: currentService.protocolo,
      status,
      approval_status: currentService.approvalStatus,
      reference_point: currentService.pontoReferencia,
      ...serializeTimeline(nextTimeline),
    });
    invalidateServicesListCaches();

    updateServiceEnhancement(id, (current) => ({
      ...current,
      status,
      timeline: nextTimeline,
    }));

    return servicosService.getById(id);
  },
};
