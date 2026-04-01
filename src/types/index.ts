/** Tipos centrais do dominio: contratos TypeScript usados na aplicacao. */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'technician';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Cliente {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  enderecoCompleto?: string;
  endereco?: Endereco;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  link?: string;
}

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

export interface Modulo {
  id: string;
  fabricante: string;
  modelo: string;
  potencia: number;
  quantidade: number;
  potenciaPico: number;
}

export interface Inversor {
  id: string;
  fabricante: string;
  modelo: string;
  potencia: number;
  quantidade: number;
  potenciaTotal: number;
}

export interface DivisaoCreditos {
  percentual: number;
  uc: string;
  classe: string;
  endereco: string;
}

export interface TimelineItem {
  id: string;
  etapa: string;
  data: string;
  status: 'concluido' | 'em_andamento' | 'pendente';
  descricao?: string;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  dataUpload: string;
  tamanho: number;
}

export interface PadraoEntradaItem {
  id: string;
  tipoLigacao: string;
  classificacao: string;
  quantidade: number;
  disjuntor: string;
}

export const StatusProjeto = {
  EM_ANALISE_DOCUMENTACAO: 'em_analise_documentacao',
  ELABORACAO_DOCUMENTACAO_TECNICA: 'elaboracao_documentacao_tecnica',
  AGUARDANDO_ASSINATURA_CLIENTE: 'aguardando_assinatura_cliente',
  PROJETO_ENVIADO_AGUARDANDO_PROTOCOLO_CONCESSIONARIA: 'projeto_enviado_aguardando_protocolo_concessionaria',
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
  CANCELADO: 'cancelado'
} as const;

export type StatusProjeto = (typeof StatusProjeto)[keyof typeof StatusProjeto];

export interface Projeto {
  id: string;
  protocolo: string;
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

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  status: 'ativo' | 'inativo';
  dataAdmissao: string;
  ultimoAcesso: string;
  permissoes: string[];
}

export const TipoServico = {
  LIGACAO_NOVA: 'ligacao_nova',
  AUMENTO_CARGA: 'aumento_carga',
  TROCA_TITULARIDADE: 'troca_titularidade',
  ALTERACAO_COMPARTILHAMENTO_CREDITO: 'alteracao_compartilhamento_credito'
} as const;

export type TipoServico = (typeof TipoServico)[keyof typeof TipoServico];

export const StatusServico = {
  ABERTURA_SERVICO: 'abertura_servico',
  ELABORACAO_DOCUMENTACAO: 'elaboracao_documentacao',
  AGUARDANDO_ASSINATURA_CLIENTE: 'aguardando_assinatura_cliente',
  AGUARDANDO_PROTOCOLO_CONCESSIONARIA: 'aguardando_protocolo_concessionaria',
  EM_ANALISE_CONCESSIONARIA: 'em_analise_concessionaria',
  RESSALVAS: 'ressalvas',
  OBRAS_CONCESSIONARIA: 'obras_concessionaria',
  SERVICO_APROVADO: 'servico_aprovado',
  VISTORIA_SOLICITADA: 'vistoria_solicitada',
  VISTORIA_REPROVADA: 'vistoria_reprovada',
  SERVICO_ENCERRADO: 'servico_encerrado'
} as const;

export type StatusServico = (typeof StatusServico)[keyof typeof StatusServico];

export interface Servico {
  id: string;
  protocolo: string;
  tipo: TipoServico;
  nome: string;
  clienteId?: string;
  cliente: string;
  concessionaria: string;
  status: StatusServico;
  dataAbertura: string;
  valor: number;
  cupomDescontoPct: number;
  valorFinal: number;
  observacoes?: string;
  tensaoFornecimento?: '127/220V' | '380/220V';
  coordenadas?: {
    latitude: string;
    longitude: string;
  };
  pontoReferencia?: string;
  padraoMaisDe30m?: 'sim' | 'nao';
  enderecoObra?: Endereco;
  ucGeradora?: string;
  enderecoGeradora?: Endereco;
  padraoEntradaItens?: PadraoEntradaItem[];
  rateios?: DivisaoCreditos[];
  documentos: Documento[];
  timeline: TimelineItem[];
  dataCriacao: string;
  dataAtualizacao: string;
}

export interface Transacao {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  data: string;
  categoria: string;
  status: 'pago' | 'pendente';
}

export interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: 'instalacao' | 'manutencao' | 'reuniao' | 'vistoria';
  local: string;
  participantes: string[];
  descricao: string;
}

export interface FaixaPrecoFotovoltaico {
  id: string;
  min: number;
  max: number;
  valor: number;
}

export interface PrecoPadraoEntrada {
  id: string;
  classificacao: string;
  tipoLigacao: string;
  valor: number;
}

export interface CupomDesconto {
  id: string;
  nome: string;
  percentual: number;
  ativo: boolean;
}

export interface ConfiguracoesSistema {
  nomeEmpresa: string;
  cnpj: string;
  telefone: string;
  email: string;
  endereco: string;
  emailNotificacoes: boolean;
  smsNotificacoes: boolean;
  notificacoesProjetos: boolean;
  notificacoesFinanceiro: boolean;
  notificacoesServicos: boolean;
  tema: 'dark' | 'light' | 'auto';
  idioma: string;
  fusoHorario: string;
  formatoData: string;
  backupAutomatico: boolean;
  frequenciaBackup: 'diario' | 'semanal' | 'mensal';
  retencaoBackup: string;
  tabelaPrecoFotovoltaico: FaixaPrecoFotovoltaico[];
  tabelaPrecoPadraoEntrada: PrecoPadraoEntrada[];
  cuponsDesconto: CupomDesconto[];
}

export interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  lastModified: string;
  type: 'table' | 'view' | 'procedure';
}

export interface Backup {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'automatic' | 'manual';
}
