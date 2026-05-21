import { asString, isRecord } from '@/core/utils/normalize';
import { approvalsService } from '@/features/aprovacoes/services/approvalsService';
import { customersService } from '@/features/clientes/services/customersService';
import { apiClient } from '@/shared/api/apiClient';
import type { DashboardStats, Documento, Projeto, StatusProjeto } from '@/types';
import {
  appendTimelineEntryForProjectStatus,
  buildInitialTimeline,
  hasAddressData,
  mergeProjectEnhancement,
  saveProjectEnhancement,
  updateProjectEnhancement,
} from './projectEnhancements';
import { extractDataFromList, normalizeProjeto, toProjetoStatus } from './projectNormalizer';
import type { CreateProjectData, Project, UpdateProjectData } from './projectTypes';

export { projectStatusFlow } from './projectNormalizer';
export type { CreateProjectData, Project, UpdateProjectData } from './projectTypes';

const PROJECTS_ENDPOINT = '/projects';

export const projectsResouces = {};

const buildFrontendEnhancement = (projectData: CreateProjectData) => ({
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
  timeline: buildInitialTimeline({ ...projectData, id: projectData.id }),
});

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
    unitControl: projectData.unitControl,
    unidade_controladora: projectData.unitControl,
  };

  if (projectData.description) {
    payload.description = projectData.description;
    payload['descrição'] = projectData.description;
  }

  return apiClient.post<unknown>(PROJECTS_ENDPOINT, payload);
};

//@TODO: isso não deve estar aqui!!!!
const isMissingCustomerName = (name: string) => {
  const normalized = name.trim().toLowerCase();
  return !normalized || normalized === 'cliente sem nome';
};

const enrichProjectsWithCustomers = async (projects: Projeto[]): Promise<Projeto[]> => {
  const requiresEnrichment = projects.some((project) =>
    isMissingCustomerName(project.cliente.nome),
  );
  if (!requiresEnrichment) return projects;

  try {
    const customers = await customersService.getAll();
    const customersById = new Map(customers.map((customer) => [customer.id, customer]));

    return projects.map((project) => {
      const knownCustomer = customersById.get(project.cliente.id);
      if (!knownCustomer) return project;

      return {
        ...project,
        cliente: {
          ...project.cliente,
          nome: isMissingCustomerName(project.cliente.nome)
            ? knownCustomer.nome
            : project.cliente.nome,
          cpfCnpj: project.cliente.cpfCnpj || knownCustomer.cpfCnpj,
          telefone: project.cliente.telefone || knownCustomer.telefone,
          email: project.cliente.email || knownCustomer.email,
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
              link: knownCustomer.endereco?.link,
            },
      };
    });
  } catch (error) {
    console.error('Erro ao enriquecer projetos com clientes:', error);
    return projects;
  }
};

export const projectsService = {
  saveDocuments(projectId: string, documentos: Documento[]) {
    // Documentos enviados apos a criacao precisam ser persistidos no enhancement local
    // porque o fluxo de upload e separado do POST principal de projeto.
    updateProjectEnhancement(projectId, (current) => ({ ...current, documentos }));
  },

  saveStatusTimeline(projectId: string, item: Projeto['timeline'][number], observacoes?: string) {
    updateProjectEnhancement(projectId, (current) => {
      const previousTimeline = current?.timeline ?? [];
      return {
        ...current,
        observacoes: observacoes ?? current?.observacoes,
        timeline: [...previousTimeline, item],
      };
    });
  },

  saveTimelineComments(
    projectId: string,
    timelineItemId: string,
    comentarios: NonNullable<Projeto['timeline'][number]['comentarios']>,
  ) {
    updateProjectEnhancement(projectId, (current) => ({
      ...current,
      timeline: (current?.timeline ?? []).map((item) =>
        item.id === timelineItemId ? { ...item, comentarios } : item,
      ),
    }));
  },

  async addTimelineComment(projectId: string, statusId: string, body: string): Promise<Project> {
    await apiClient.post<unknown>(
      `${PROJECTS_ENDPOINT}/${projectId}/statuses/${statusId}/comments`,
      { body },
    );

    return projectsService.getById(projectId);
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
      clientName: mergedProject.cliente.nome,
    });
    return mergedProject;
  },

  async approvePending(
    id: string,
    nextStatus: StatusProjeto = 'em_analise_documentacao',
  ): Promise<Project> {
    return projectsService.updateStatus(
      id,
      nextStatus,
      'Projeto aprovado no frontend e liberado para o fluxo operacional.',
    );
  },

  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<unknown[]>(PROJECTS_ENDPOINT);
    const projects = extractDataFromList(response)
      .map(normalizeProjeto)
      .map(mergeProjectEnhancement);
    return enrichProjectsWithCustomers(projects);
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<unknown>(`${PROJECTS_ENDPOINT}/${id}`);
    const normalized = mergeProjectEnhancement(normalizeProjeto(response));
    const customerDetails =
      normalized.cliente.id && normalized.cliente.id !== 'sem-cliente'
        ? await customersService.getById(normalized.cliente.id).catch(() => null)
        : null;
    const [enrichedProject] = await enrichProjectsWithCustomers([normalized]);
    const enriched =
      customerDetails && !hasAddressData(enrichedProject.endereco)
        ? {
            ...enrichedProject,
            cliente: {
              ...enrichedProject.cliente,
              nome: enrichedProject.cliente.nome || customerDetails.nome,
              cpfCnpj: enrichedProject.cliente.cpfCnpj || customerDetails.cpfCnpj,
              telefone: enrichedProject.cliente.telefone || customerDetails.telefone,
              email: enrichedProject.cliente.email || customerDetails.email,
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
                  link: customerDetails.endereco.link,
                }
              : enrichedProject.endereco,
          }
        : enrichedProject;

    return enriched;
  },

  async getByIdRaw(id: string): Promise<Record<string, unknown>> {
    const response = await apiClient.get<unknown>(`${PROJECTS_ENDPOINT}/${id}`);
    return isRecord(response) ? response : {};
  },

  async update(
    id: string,
    projectData: UpdateProjectData | Record<string, unknown>,
  ): Promise<Project> {
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
          descrição: projectData.description,
          amount:
            typeof projectData.amount === 'number'
              ? String(projectData.amount)
              : projectData.amount,
          fastTrack: normalizedFastTrack,
        }
      : { id };
    const response = await apiClient.put<unknown>(`${PROJECTS_ENDPOINT}/${id}`, payloadWithId);
    return normalizeProjeto(response);
  },

  async updateStatus(id: string, name: string, comment?: string): Promise<Project> {
    const payload: Record<string, unknown> = { name };
    if (comment) payload.comment = comment;

    await apiClient.post<unknown>(`${PROJECTS_ENDPOINT}/${id}/statuses`, payload);
    const normalized = normalizeProjeto(await apiClient.get<unknown>(`${PROJECTS_ENDPOINT}/${id}`));
    const newStatus = normalized.status;

    updateProjectEnhancement(id, (current) => ({
      ...current,
      status: newStatus,
      timeline: appendTimelineEntryForProjectStatus(
        normalized,
        current?.timeline ?? normalized.timeline,
        newStatus,
        comment,
      ),
    }));

    return mergeProjectEnhancement(normalized);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`${PROJECTS_ENDPOINT}/${id}`);
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
      'aguardando_pagamento',
    ]);
    const statusFinalizado = new Set<StatusProjeto>(['projeto_encerrado']);

    return {
      totalProjetos: projetos.length,
      projetosEmAndamento: projetos.filter(
        (p) => !statusPendente.has(p.status) && !statusFinalizado.has(p.status),
      ).length,
      projetosFinalizados: projetos.filter((p) => statusFinalizado.has(p.status)).length,
      projetosPendentes: projetos.filter((p) => statusPendente.has(p.status)).length,
    };
  },
};
