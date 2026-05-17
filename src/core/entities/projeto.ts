import type {
  Documento,
  DivisaoCreditos,
  Endereco,
  Inversor,
  Modulo,
  PadraoEntradaItem,
  TimelineItem,
} from './comum';

export interface DadosProjeto {
  concessionaria: string;
  classe: string;
  integrador: string;
  modalidade: 'autoconsumo_local' | 'autoconsumo_remoto' | 'geracao_compartilhada';
  enquadramento: string;
  potenciaSistema: number;
  protecaoCC: string;
}

export interface DadosTecnicos {
  tensao: number;
  numeroFases: number;
  ramal: string;
  disjuntor: string;
  cargaInstalada: number;
  modulos: Modulo[];
  inversores: Inversor[];
  divisaoCreditos: DivisaoCreditos[];
}

export const StatusProjeto = {
  EM_ANALISE_DOCUMENTACAO: 'em_analise_documentacao',
  ELABORACAO_DOCUMENTACAO_TECNICA: 'elaboracao_documentacao_tecnica',
  AGUARDANDO_ASSINATURA_CLIENTE: 'aguardando_assinatura_cliente',
  PROJETO_ENVIADO_AGUARDANDO_PROTOCOLO_CONCESSIONARIA:
    'projeto_enviado_aguardando_protocolo_concessionaria',
  EM_ANALISE_CONCESSIONARIA: 'em_analise_concessionaria',
  RESSALVAS_PROJETOS: 'ressalvas_projetos',
  OBRAS_CONCESSIONARIA: 'obras_concessionaria',
  PROJETO_APROVADO: 'projeto_aprovado',
  VISTORIA_SOLICITADA: 'vistoria_solicitada',
  VISTORIA_REPROVADA: 'vistoria_reprovada',
  AGUARDANDO_PAGAMENTO: 'aguardando_pagamento',
  PROJETO_ENCERRADO: 'projeto_encerrado',
  // Compatibilidade com dados legados.
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  AGUARDANDO_APROVACAO: 'aguardando_aprovacao',
  APROVADO: 'aprovado',
  INSTALACAO: 'instalacao',
  CONCLUIDO: 'concluido',
  CANCELADO: 'cancelado',
} as const;

export type StatusProjeto = (typeof StatusProjeto)[keyof typeof StatusProjeto];

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  enderecoCompleto?: string;
  endereco?: Endereco;
}

export interface Projeto {
  id: string;
  protocolo: string;
  sequence: number;
  subsequente: string;
  cliente: Cliente;
  endereco: Endereco;
  dadosProjeto: DadosProjeto;
  dadosTecnicos: DadosTecnicos;
  modulos: Modulo[];
  inversores: Inversor[];
  divisaoCreditos: DivisaoCreditos[];
  timeline: TimelineItem[];
  documentos: Documento[];
  status: StatusProjeto;
  valor: number;
  tipoProjeto?: string;
  servicos?: string[];
  numeroUc?: string;
  dataAbertura?: string;
  coordenadas?: {
    latitude: string;
    longitude: string;
  };
  latitude?: string;
  longitude?: string;
  tensaoFornecimento?: string;
  padraoEntradaItens?: PadraoEntradaItem[];
  projetoFastTrack?: string;
  projetoNovo?: string;
  zeroGridControleExportacao?: string;
  observacoes?: string;
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface DashboardStats {
  totalProjetos: number;
  projetosEmAndamento: number;
  projetosFinalizados: number;
  projetosPendentes: number;
}
