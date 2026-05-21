export type {
  User,
  LoginCredentials,
  ApiListParams,
  PaginatedResponse,
  Endereco,
  Documento,
  TimelineComment,
  TimelineItem,
  PadraoEntradaItem,
  Modulo,
  Inversor,
  DivisaoCreditos,
} from './comum';

export type { DadosProjeto, DadosTecnicos, Cliente, Projeto, DashboardStats } from './projeto';
export { StatusProjeto } from './projeto';

export type { Servico } from './servico';
export { TipoServico, StatusServico } from './servico';

export type { Usuario } from './usuario';

export type {
  Transacao,
  Evento,
  FaixaPrecoFotovoltaico,
  PrecoPadraoEntrada,
  CupomDesconto,
  ConfiguracoesSistema,
} from './financeiro';
