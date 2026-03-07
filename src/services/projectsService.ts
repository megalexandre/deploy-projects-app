/** Camada de acesso a dados para 'projectsService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Projeto, DashboardStats, PaginatedResponse, StatusProjeto } from '../types';
import { apiClient } from './apiClient';
import { customersService } from './customersService';

export type Project = Projeto;

export interface CreateProjectData {
  id?: string;
  clienteId: string;
  concessionaria: string;
  protocoloConcessionaria: string;
  classe: string;
  integrator: string;
  modalidade: string;
  enquadramento: string;
  protecaoCC?: string;
  potenciaSistema?: number;
  status?: string;
  valor?: number;
  nomeCliente?: string;
}

export interface UpdateProjectData {
  id?: string;
  clienteId?: string;
  nomeCliente?: string;
  concessionaria?: string;
  protocoloConcessionaria?: string;
  classe?: string;
  integrator?: string;
  modalidade?: string;
  enquadramento?: string;
  protecaoCC?: string;
  potenciaSistema?: number;
  valor?: number;
  status?: string;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

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

const normalizeStatusKey = (rawStatus: unknown): string => {
  return asString(rawStatus)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');
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

const normalizeProjeto = (raw: unknown): Projeto => {
  const project = isRecord(raw) ? raw : {};
  const cliente = isRecord(project.cliente) ? project.cliente : {};
  const customer = isRecord(project.customer) ? project.customer : {};
  const endereco = isRecord(project.endereco) ? project.endereco : {};
  const dadosProjeto = isRecord(project.dadosProjeto) ? project.dadosProjeto : {};
  const financeiro = isRecord(project.financeiro) ? project.financeiro : {};
  const dadosTecnicos = isRecord(project.dadosTecnicos) ? project.dadosTecnicos : {};

  const id = asString(project.id) || crypto.randomUUID();
  const protocolo =
    asString(project.protocolo) ||
    asString(project.protocoloConcessionaria) ||
    `PROJ-${id.slice(0, 8).toUpperCase()}`;

  return {
    id,
    protocolo,
    cliente: {
      id:
        asString(cliente.id) ||
        asString(customer.id) ||
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
      logradouro: asString(endereco.logradouro) || asString(project.enderecoCompleto),
      numero: asString(endereco.numero),
      complemento: asString(endereco.complemento),
      bairro: asString(endereco.bairro),
      cidade: asString(endereco.cidade),
      estado: asString(endereco.estado)
    },
    dadosProjeto: {
      concessionaria: asString(dadosProjeto.concessionaria) || asString(project.concessionaria),
      classe: asString(dadosProjeto.classe) || asString(project.classe),
      integrador: asString(dadosProjeto.integrador) || asString(project.integrator),
      modalidade:
        asString(dadosProjeto.modalidade || project.modalidade).toLowerCase().includes('compart')
          ? 'geracao_compartilhada'
          : 'autoconsumo',
      enquadramento: asString(dadosProjeto.enquadramento) || asString(project.enquadramento),
      potenciaSistema: asNumber(dadosProjeto.potenciaSistema ?? project.potenciaSistema),
      protecaoCC: asString(dadosProjeto.protecaoCC) || asString(project.protecaoCC)
    },
    dadosTecnicos: {
      tensao: asNumber(dadosTecnicos.tensao),
      numeroFases: asNumber(dadosTecnicos.numeroFases),
      ramal: asString(dadosTecnicos.ramal),
      disjuntor: asString(dadosTecnicos.disjuntor),
      cargaInstalada: asNumber(dadosTecnicos.cargaInstalada)
    },
    modulos: asArray<Projeto['modulos'][number]>(project.modulos),
    inversores: asArray<Projeto['inversores'][number]>(project.inversores),
    divisaoCreditos: asArray<Projeto['divisaoCreditos'][number]>(project.divisaoCreditos),
    timeline: asArray<Projeto['timeline'][number]>(project.timeline),
    documentos: asArray<Projeto['documentos'][number]>(project.documentos),
    status: toProjetoStatus(project.status ?? project.projectStatus ?? project.situacao ?? project.state),
    valor: asNumber(project.valor ?? project.value ?? dadosProjeto.valor ?? financeiro.valor),
    dataCriacao: asString(project.dataCriacao) || asString(project.createdAt) || new Date().toISOString(),
    dataAtualizacao: asString(project.dataAtualizacao) || asString(project.updatedAt) || new Date().toISOString()
  };
};

const PROJECTS_ENDPOINT = '/projects';

const createRaw = async (projectData: CreateProjectData): Promise<unknown> => {
  return apiClient.post<unknown>(PROJECTS_ENDPOINT, projectData);
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
        }
      };
    });
  } catch (error) {
    console.error('Erro ao enriquecer projetos com clientes:', error);
    return projects;
  }
};

export const projectsService = {
  async create(projectData: CreateProjectData): Promise<Project> {
    const response = await createRaw(projectData);
    return normalizeProjeto(response);
  },

  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<unknown[] | PaginatedResponse<unknown>>(PROJECTS_ENDPOINT);
    const projects = extractDataFromList(response).map(normalizeProjeto);
    return enrichProjectsWithCustomers(projects);
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<unknown>(`/projects/${id}`);
    return normalizeProjeto(response);
  },

  async getByIdRaw(id: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get<unknown>(`/projects/${id}`);
    return isRecord(response) ? response : {};
  },

  async update(id: string, projectData: UpdateProjectData | Record<string, unknown>): Promise<Project> {
    const payloadWithId = isRecord(projectData) ? { id, ...projectData } : { id };
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


