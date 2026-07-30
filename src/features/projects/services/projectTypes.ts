import type { Documento, PadraoEntradaItem, Projeto } from '@/types';

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
  secondaryProtocol?: string;
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
  dataAbertura?: string;
  latitude?: string;
  longitude?: string;
  tensaoFornecimento?: string;
  padraoEntradaItens?: PadraoEntradaItem[];
  modulos?: Projeto['modulos'];
  inversores?: Projeto['inversores'];
  documentos?: Documento[];
  projetoNovo?: string;
  zeroGridControleExportacao?: string;
  divisaoCreditos?: Projeto['divisaoCreditos'];
}
