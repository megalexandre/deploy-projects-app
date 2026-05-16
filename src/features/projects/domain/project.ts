import type { Endereco } from '@/core/entities/comum';
import type { Projeto } from '@/core/entities/projeto';
import type { Customer } from '@/features/clientes/services/customersService';
import { toProjetoStatus } from '../services/projectNormalizer';

//#TODO provavelmente vai dar pra excluir isso depois de refatorar
// vou usar agora só pra fazer o de-para

export interface ProjectCommentResponse {
  id: string;
  body: string;
  created_by: string;
  created_at: string;
}

export interface ProjectStatusResponse {
  id: string;
  name: string;
  comments: ProjectCommentResponse[];
  created_by: string;
  created_at: string;
}

export interface CoordinatesResponse {
  latitude: string;
  longitude: string;
}

export interface ProjectResponse {
  id: string;
  client_id: string;
  address_id: string;
  utility_company: string;
  utility_protocol: string;
  customer_class: string;
  integrator: string;
  modality: string;
  framework: string;
  status: string;
  amount: string;
  dc_protection: string;
  system_power: number;
  unit_control: string;
  project_type: string;
  fast_track: boolean;
  services_names: string[];
  sequence: number;
  statuses: ProjectStatusResponse[];

  coordinates?: CoordinatesResponse;
  subsequence?: number;
  description?: string;

  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

const EMPTY_ENDERECO: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' };

export const toProjeto = (r: ProjectResponse, customer?: Customer, endereco?: Endereco): Projeto => ({
  id: r.id,
  protocolo: r.utility_protocol,
  sequence: r.sequence,
  subsequente: r.subsequence ? String(r.subsequence) : '',

  cliente: {
    id: customer?.id ?? r.client_id,
    nome: customer?.nome ?? '',
    cpfCnpj: customer?.cpfCnpj ?? '',
    telefone: customer?.telefone ?? '',
    email: customer?.email ?? '',
    endereco: customer?.endereco,
  },

  endereco: endereco ?? EMPTY_ENDERECO,
  
  dadosProjeto: {
    concessionaria: r.utility_company,
    classe: r.customer_class,
    integrador: r.integrator,
    modalidade: 'autoconsumo_local',
    enquadramento: r.framework,
    potenciaSistema: r.system_power,
    protecaoCC: r.dc_protection,
  },
  dadosTecnicos: { tensao: 0, numeroFases: 0, ramal: '', disjuntor: '', cargaInstalada: 0, modulos: [], inversores: [], divisaoCreditos: [] },
  modulos: [],
  inversores: [],
  divisaoCreditos: [],
  timeline: [],
  documentos: [],
  status: toProjetoStatus(r.status),
  valor: Number(r.amount) || 0,
  tipoProjeto: r.project_type,
  servicos: r.services_names,
  numeroUc: r.unit_control,
  coordenadas: r.coordinates ?? undefined,
  latitude: r.coordinates?.latitude,
  longitude: r.coordinates?.longitude,
  projetoFastTrack: r.fast_track ? 'sim' : 'nao',
  observacoes: r.description,
  dataCriacao: r.created_at,
  dataAtualizacao: r.updated_at,
});
