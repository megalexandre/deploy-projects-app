/** Camada de acesso a dados para 'servicosService': integra a API e preserva no frontend apenas os campos ainda nao suportados pelo backend. */
import type { Documento, DivisaoCreditos, Endereco, PadraoEntradaItem, Servico, StatusServico, TimelineItem, TipoServico } from '@/types';
import { parseCoordinate } from '@/core/utils/masks';
import { asNumber, asString, isRecord } from '@/core/utils/normalize';
import { createRecordStorage } from '@/core/utils/storage';
import { addressService } from '@/shared/api/addressService';
import { apiClient } from '@/shared/api/apiClient';
import { filesService } from '@/shared/api/filesService';
import { concessionariasService } from '@/features/admin/services/concessionariasService';
import { customersService } from '@/features/clientes/services/customersService';
import { approvalsService } from '@/features/aprovacoes/services/approvalsService';
import { getSessionUser } from '@/shared/session/sessionUser';

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

type RawServiceRecord = Record<string, unknown>;

type ServiceEnhancement = {
  protocolo?: string;
  status?: StatusServico;
  timeline?: TimelineItem[];
  documentos?: Documento[];
  pontoReferencia?: string;
  clienteNome?: string;
  concessionariaNome?: string;
  precisaAprovacao?: boolean;
};

const serviceEnhancementStorage = createRecordStorage<ServiceEnhancement>('opj_frontend_service_enhancements');

const SERVICE_STATUS_FLOW: Array<{ status: StatusServico; etapa: string }> = [
  { status: 'aguardando_aprovacao', etapa: 'Aguardando Aprovacao' },
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
    url: normalizeText(item.url) || undefined
  }));

const buildBackendDocument = (documento: { id: string; fileName: string; urlS3: string; size: number; createdAt?: string }, current?: Documento): Documento => ({
  id: documento.id,
  fileId: documento.id,
  nome: documento.fileName,
  tipo: current?.tipo || 'Documento',
  dataUpload: current?.dataUpload || documento.createdAt || new Date().toISOString(),
  tamanho: documento.size,
  url: documento.urlS3 || current?.url
});

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

const buildTimelineFromStatus = (serviceId: string, status: StatusServico, dataAbertura: string, dataAtualizacao: string) =>
  normalizeTimeline(serviceId, status, dataAbertura, dataAtualizacao, undefined);

const normalizeCoordinates = (value: unknown): Servico['coordenadas'] | undefined => {
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

const mergeServiceEnhancement = (service: Servico): Servico => {
  const enhancement = serviceEnhancementStorage.read()[service.id];
  if (!enhancement) {
    return service;
  }

  const status = normalizeStatus(enhancement.status ?? service.status);
  const timeline = enhancement.timeline?.length
    ? normalizeTimeline(service.id, status, service.dataAbertura, service.dataAtualizacao, enhancement.timeline)
    : service.timeline;

  return {
    ...service,
    protocolo: enhancement.protocolo || service.protocolo,
    status,
    timeline,
    documentos: enhancement.documentos?.length ? normalizeDocumentos(enhancement.documentos) : service.documentos,
    pontoReferencia: enhancement.pontoReferencia || service.pontoReferencia,
    cliente: enhancement.clienteNome || service.cliente,
    concessionaria: enhancement.concessionariaNome || service.concessionaria,
    precisaAprovacao: enhancement.precisaAprovacao ?? service.precisaAprovacao
  };
};

const updateServiceEnhancement = (
  serviceId: string,
  updater: (current: ServiceEnhancement | undefined) => ServiceEnhancement
) => {
  const current = serviceEnhancementStorage.read();
  current[serviceId] = updater(current[serviceId]);
  serviceEnhancementStorage.write(current);
};

const buildServiceEnhancement = (payload: CreateServicoPayload, serviceId: string): ServiceEnhancement => {
  const sessionUser = getSessionUser();
  const precisaAprovacao = sessionUser ? !sessionUser.isAdmin : false;
  const initialStatus: StatusServico = precisaAprovacao ? 'aguardando_aprovacao' : 'abertura_servico';
  const now = new Date().toISOString();

  return {
    protocolo: createProtocol(),
    status: initialStatus,
    timeline: buildTimelineFromStatus(serviceId, initialStatus, payload.dataAbertura, now),
    documentos: normalizeDocumentos(payload.documentos),
    pontoReferencia: normalizeText(payload.pontoReferencia) || undefined,
    clienteNome: normalizeText(payload.cliente) || undefined,
    concessionariaNome: normalizeText(payload.concessionaria) || undefined,
    precisaAprovacao
  };
};

const normalizeServiceFromApi = (
  raw: unknown,
  refs: {
    customerNamesById: Map<string, string>;
    concessionaireNamesById: Map<string, string>;
    addressesById: Map<string, Endereco>;
    documentsByServiceId?: Map<string, Documento[]>;
  }
): Servico => {
  const service = isRecord(raw) ? raw : {};
  const id = asString(service.id) || crypto.randomUUID();
  const dataCriacao = asString(service.created_at) || new Date().toISOString();
  const dataAtualizacao = asString(service.updated_at) || dataCriacao;
  const enhancement = serviceEnhancementStorage.read()[id];
  const status = normalizeStatus(enhancement?.status);
  const dataAbertura = asString(service.opening_date) || dataCriacao.slice(0, 10);
  const valor = asNumber(service.amount);
  const cupomDescontoPct = asNumber(service.discount_coupon_percentage);
  const valorFinal = Math.max(valor - valor * (cupomDescontoPct / 100), 0);
  const customerId = asString(service.customer_id) || undefined;
  const concessionariaId = asString(service.concessionaire_id) || undefined;
  const protocolo = enhancement?.protocolo || buildStableProtocol(id, dataCriacao);
  const documentos = refs.documentsByServiceId?.get(id) ?? normalizeDocumentos(enhancement?.documentos);

  return {
    id,
    protocolo,
    tipo: (asString(service.service_type) as TipoServico) || 'ligacao_nova',
    nome: SERVICE_TYPE_LABELS[(asString(service.service_type) as TipoServico) || 'ligacao_nova'],
    clienteId: customerId,
    concessionariaId: concessionariaId,
    cliente: enhancement?.clienteNome || refs.customerNamesById.get(customerId ?? '') || 'Cliente nao informado',
    concessionaria: enhancement?.concessionariaNome || refs.concessionaireNamesById.get(concessionariaId ?? '') || 'Concessionaria nao informada',
    status,
    dataAbertura,
    valor,
    cupomDescontoPct,
    valorFinal,
    observacoes: asString(service.observations) || undefined,
    tensaoFornecimento: (asString(service.supply_voltage) as Servico['tensaoFornecimento']) || undefined,
    coordenadas: normalizeCoordinates(service.coordinates),
    pontoReferencia: enhancement?.pontoReferencia || undefined,
    padraoMaisDe30m: service.pole_distance_over_30m === true ? 'sim' : service.pole_distance_over_30m === false ? 'nao' : undefined,
    enderecoObra: cloneEndereco(refs.addressesById.get(asString(service.construction_address_id))),
    ucGeradora: asString(service.generating_consumer_unit) || undefined,
    enderecoGeradora: cloneEndereco(refs.addressesById.get(asString(service.generating_address_id))),
    padraoEntradaItens: normalizePadraoItens(
      Array.isArray(service.service_entry_items)
        ? service.service_entry_items.map((item) => {
            const normalized = isRecord(item) ? item : {};
            return {
              id: asString(normalized.id),
              tipoLigacao: asString(normalized.connection_type),
              classificacao: asString(normalized.classification),
              quantidade: asNumber(normalized.quantity),
              disjuntor: asString(normalized.circuit_breaker)
            };
          })
        : []
    ),
    rateios: normalizeRateios(
      Array.isArray(service.apportionments)
        ? service.apportionments.map((item) => {
            const normalized = isRecord(item) ? item : {};
            return {
              uc: asString(normalized.consumer_unit),
              endereco: asString(normalized.address),
              classe: asString(normalized.classification),
              percentual: asNumber(normalized.percentage)
            };
          })
        : []
    ),
    documentos,
    timeline: normalizeTimeline(id, status, dataAbertura, dataAtualizacao, enhancement?.timeline),
    precisaAprovacao: enhancement?.precisaAprovacao ?? false,
    dataCriacao,
    dataAtualizacao
  };
};

const sortByDate = (items: Servico[]) =>
  [...items].sort((left, right) => new Date(right.dataCriacao).getTime() - new Date(left.dataCriacao).getTime());

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
    link: normalizeText(endereco.link)
  };
};

const loadReferenceData = async (records: RawServiceRecord[]) => {
  const [customers, concessionarias] = await Promise.all([
    customersService.getAll().catch(() => []),
    concessionariasService.getAll().catch(() => [])
  ]);

  const addressIds = Array.from(new Set(records.flatMap((record) => [
    asString(record.construction_address_id),
    asString(record.generating_address_id)
  ]).filter(Boolean)));

  const addresses = await Promise.all(addressIds.map(async (addressId) => {
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
          link: address.link
        } satisfies Endereco
      };
    } catch {
      return null;
    }
  }));

  return {
    customerNamesById: new Map(customers.map((customer) => [customer.id, customer.nome])),
    concessionaireNamesById: new Map(concessionarias.map((item) => [item.id, item.nome])),
    addressesById: new Map(
      addresses
        .filter((item) => item !== null)
        .map((item) => [item.id, item.endereco] as const)
    )
  };
};

const resolveCustomerId = async (payload: Pick<CreateServicoPayload, 'clienteId' | 'cliente'>) => {
  if (payload.clienteId) {
    return payload.clienteId;
  }

  const customerName = normalizeText(payload.cliente).toLowerCase();
  if (!customerName) {
    throw new Error('Selecione um cliente cadastrado para salvar o servico na API.');
  }

  const customers = await customersService.getAll();
  const matched = customers.find((item) => item.nome.trim().toLowerCase() === customerName);
  if (!matched) {
    throw new Error('O backend exige um cliente cadastrado. Selecione um cliente existente para continuar.');
  }

  return matched.id;
};

const resolveConcessionaireId = async (concessionaria: string) => {
  const normalizedTarget = normalizeText(concessionaria).toLowerCase();
  const concessionarias = await concessionariasService.getAll();
  const matched = concessionarias.find(
    (item) => item.id === concessionaria || item.nome.trim().toLowerCase() === normalizedTarget
  );

  if (!matched) {
    throw new Error('Selecione uma concessionaria valida para salvar o servico na API.');
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
      ...payload
    });
    return updated.id;
  }

  const created = await addressService.create(payload);
  return created.id;
};

const buildApiPayload = async (
  payload: CreateServicoPayload | UpdateServicoPayload,
  current?: RawServiceRecord
) => {
  const customerId =
    payload.clienteId !== undefined || payload.cliente !== undefined
      ? await resolveCustomerId({
          clienteId: payload.clienteId,
          cliente: payload.cliente ?? ''
        })
      : asString(current?.customer_id);
  const concessionaireId =
    payload.concessionaria !== undefined
      ? await resolveConcessionaireId(payload.concessionaria)
      : asString(current?.concessionaire_id);
  const constructionAddressId = payload.enderecoObra !== undefined
    ? await persistAddress(asString(current?.construction_address_id) || undefined, payload.enderecoObra)
    : asString(current?.construction_address_id) || undefined;
  const generatingAddressId = payload.enderecoGeradora !== undefined
    ? await persistAddress(asString(current?.generating_address_id) || undefined, payload.enderecoGeradora)
    : asString(current?.generating_address_id) || undefined;

  return {
    service_type: payload.tipo ?? asString(current?.service_type),
    customer_id: customerId,
    concessionaire_id: concessionaireId,
    opening_date: payload.dataAbertura ?? asString(current?.opening_date),
    amount: payload.valor ?? current?.amount,
    discount_coupon_percentage:
      payload.cupomDescontoPct ?? current?.discount_coupon_percentage ?? 0,
    observations: payload.observacoes ?? asString(current?.observations),
    supply_voltage: payload.tensaoFornecimento ?? asString(current?.supply_voltage),
    coordinates:
      payload.coordenadas !== undefined
        ? buildPointWkt(payload.coordenadas)
        : current?.coordinates,
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
            percentage: item.percentual
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
            circuit_breaker: item.disjuntor
          }))
        : Array.isArray(current?.service_entry_items)
          ? undefined
          : []
  };
};

const getServiceRaw = async (id: string): Promise<RawServiceRecord> => {
  const response = await apiClient.get<unknown>(`/services/${id}`);
  return isRecord(response) ? response : {};
};

export const servicosService = {
  statusFlow: SERVICE_STATUS_FLOW,
  typeLabels: SERVICE_TYPE_LABELS,

  async saveDocuments(id: string, documentos: Documento[]): Promise<Servico> {
    updateServiceEnhancement(id, (current) => ({
      ...current,
      documentos: normalizeDocumentos(documentos)
    }));

    return servicosService.getById(id);
  },

  async list(): Promise<Servico[]> {
    const response = await apiClient.get<unknown[]>('/services');
    const records = Array.isArray(response)
      ? response.map((item) => (isRecord(item) ? item : {}))
      : [];
    const refs = await loadReferenceData(records);

    return sortByDate(records.map((record) => mergeServiceEnhancement(normalizeServiceFromApi(record, refs))));
  },

  async getById(id: string): Promise<Servico> {
    const raw = await getServiceRaw(id);
    const [refs, uploads] = await Promise.all([
      loadReferenceData([raw]),
      filesService.listByItem(id).catch(() => [])
    ]);
    const currentDocuments = serviceEnhancementStorage.read()[id]?.documentos ?? [];
    const documentsByServiceId = new Map<string, Documento[]>([
      [
        id,
        uploads.map((item) =>
          buildBackendDocument(
            item,
            currentDocuments.find((documento) => (documento.fileId || documento.id) === item.id)
          )
        )
      ]
    ]);

    return mergeServiceEnhancement(normalizeServiceFromApi(raw, { ...refs, documentsByServiceId }));
  },

  async create(payload: CreateServicoPayload): Promise<Servico> {
    const apiPayload = await buildApiPayload(payload);
    const response = await apiClient.post<unknown>('/services', apiPayload);
    const raw = isRecord(response) ? response : {};
    const serviceId = asString(raw.id) || crypto.randomUUID();
    const enhancement = buildServiceEnhancement(payload, serviceId);

    updateServiceEnhancement(serviceId, (current) => ({
      ...current,
      ...enhancement
    }));

    const createdService = await servicosService.getById(serviceId);
    if (!createdService.precisaAprovacao) {
      return createdService;
    }

    approvalsService.createForNonAdmin({
      entityType: 'servico',
      entityId: createdService.id,
      entityLabel: createdService.protocolo,
      clientName: createdService.cliente
    });

    return createdService;
  },

  async approvePending(id: string, nextStatus: StatusServico = 'abertura_servico'): Promise<Servico> {
    const currentService = await servicosService.getById(id);
    const nextUpdatedAt = new Date().toISOString();

    updateServiceEnhancement(id, (current) => ({
      ...current,
      status: nextStatus,
      timeline: buildTimeline(id, nextStatus, currentService.dataAbertura, nextUpdatedAt)
    }));

    return servicosService.getById(id);
  },

  async update(id: string, payload: UpdateServicoPayload): Promise<Servico> {
    const currentRaw = await getServiceRaw(id);
    const currentService = await servicosService.getById(id);
    const nextStatus = payload.status ?? currentService.status;
    const nextUpdatedAt = new Date().toISOString();

    updateServiceEnhancement(id, (current) => ({
      ...current,
      status: nextStatus,
      timeline:
        payload.timeline ??
        current?.timeline ??
        buildTimeline(id, nextStatus, currentService.dataAbertura, nextUpdatedAt),
      documentos: payload.documentos ? normalizeDocumentos(payload.documentos) : current?.documentos,
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
          : current?.concessionariaNome
    }));

    const apiPayload = await buildApiPayload(payload, currentRaw);
    await apiClient.put<unknown>(`/services/${id}`, apiPayload);
    return servicosService.getById(id);
  },

  async updateStatus(id: string, status: StatusServico): Promise<Servico> {
    const currentService = await servicosService.getById(id);
    updateServiceEnhancement(id, (current) => ({
      ...current,
      status,
      timeline: buildTimeline(id, status, currentService.dataAbertura, new Date().toISOString())
    }));

    return servicosService.getById(id);
  }
};
