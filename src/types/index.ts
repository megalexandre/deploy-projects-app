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
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface DadosProjeto {
  concessionaria: string;
  classe: string;
  integrador: string;
  modalidade: 'geracao_compartilhada' | 'autoconsumo';
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

export const StatusProjeto = {
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

export interface Servico {
  id: string;
  nome: string;
  cliente: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  data: string;
  valor: number;
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
