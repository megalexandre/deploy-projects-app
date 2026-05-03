import type { Documento, DivisaoCreditos, Endereco, PadraoEntradaItem, TimelineItem } from './comum';

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
