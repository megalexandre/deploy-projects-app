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

export const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
  [StatusProjeto.CONCLUIDO]: { color: 'text-green-400', label: 'Concluído' },
  [StatusProjeto.PROJETO_ENCERRADO]: { color: 'text-green-400', label: 'Projeto Encerrado' },
  [StatusProjeto.EM_ANDAMENTO]: { color: 'text-cyan-300', label: 'Em Andamento' },
  [StatusProjeto.EM_ANALISE_CONCESSIONARIA]: {
    color: 'text-cyan-300',
    label: 'Em Análise na Concessionária',
  },
  [StatusProjeto.PENDENTE]: { color: 'text-yellow-300', label: 'Pendente' },
  [StatusProjeto.EM_ANALISE_DOCUMENTACAO]: {
    color: 'text-yellow-300',
    label: 'Em Análise de Documentação',
  },
  [StatusProjeto.ELABORACAO_DOCUMENTACAO_TECNICA]: {
    color: 'text-yellow-300',
    label: 'Elaboração de Documentação Técnica',
  },
  [StatusProjeto.AGUARDANDO_ASSINATURA_CLIENTE]: {
    color: 'text-yellow-300',
    label: 'Aguardando Assinatura do Cliente',
  },
  [StatusProjeto.PROJETO_ENVIADO_AGUARDANDO_PROTOCOLO_CONCESSIONARIA]: {
    color: 'text-yellow-300',
    label: 'Enviado — Aguardando Protocolo',
  },
  [StatusProjeto.RESSALVAS_PROJETOS]: { color: 'text-yellow-300', label: 'Ressalvas no Projeto' },
  [StatusProjeto.OBRAS_CONCESSIONARIA]: {
    color: 'text-yellow-300',
    label: 'Obras na Concessionária',
  },
  [StatusProjeto.PROJETO_APROVADO]: { color: 'text-yellow-300', label: 'Projeto Aprovado' },
  [StatusProjeto.APROVADO]: { color: 'text-yellow-300', label: 'Aprovado' },
  [StatusProjeto.VISTORIA_SOLICITADA]: { color: 'text-yellow-300', label: 'Vistoria Solicitada' },
  [StatusProjeto.VISTORIA_REPROVADA]: { color: 'text-red-400', label: 'Vistoria Reprovada' },
  [StatusProjeto.CANCELADO]: { color: 'text-red-400', label: 'Cancelado' },
  [StatusProjeto.AGUARDANDO_APROVACAO]: { color: 'text-amber-200', label: 'Aguardando Aprovação' },
  [StatusProjeto.AGUARDANDO_PAGAMENTO]: { color: 'text-amber-200', label: 'Aguardando Pagamento' },
  [StatusProjeto.INSTALACAO]: { color: 'text-opj-orange', label: 'Instalação' },
};

export const getStatusColor = (status: string): string =>
  STATUS_CONFIG[status]?.color ?? 'text-gray-400';

export const getStatusLabel = (status: string): string => STATUS_CONFIG[status]?.label ?? status;

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
