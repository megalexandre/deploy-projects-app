export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isAdmin: boolean;
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

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  dataUpload: string;
  tamanho: number;
  fileId?: string;
  url?: string;
}

export interface TimelineItem {
  id: string;
  etapa: string;
  data: string;
  status: 'concluido' | 'em_andamento' | 'pendente';
  descricao?: string;
}

export interface PadraoEntradaItem {
  id: string;
  tipoLigacao: string;
  classificacao: string;
  quantidade: number;
  disjuntor: string;
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
