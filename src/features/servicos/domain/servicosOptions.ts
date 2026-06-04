import type { StatusServico, TipoServico } from '@/types';

export const DEFAULT_VISIBLE_SERVICES = 5;

export const tipoServicoOptions: Array<{
  value: TipoServico;
  label: string;
  description: string;
}> = [
  {
    value: 'ligacao_nova',
    label: 'Ligacao Nova',
    description: 'Endereco da obra, tensao, coordenadas, padrao e uploads.',
  },
  {
    value: 'aumento_carga',
    label: 'Aumento de Carga',
    description: 'Mesmo fluxo tecnico de ligacao nova, com anexos da unidade atual.',
  },
  {
    value: 'troca_titularidade',
    label: 'Troca de Titularidade',
    description: 'Usa o mesmo fluxo tecnico e os mesmos campos de aumento de carga.',
  },
  {
    value: 'alteracao_compartilhamento_credito',
    label: 'Alteracao Compartilhamento de Credito',
    description: 'UC geradora, endereco e rateio das beneficiarias.',
  },
];

export const tipoLigacaoOptions = ['Monofasico', 'Bifasico', 'Trifasico'];
export const classificacaoOptions = [
  'Residencial',
  'Comercial',
  'Industrial',
  'Rural',
  'Condominio',
];

export const statusColumnStyles: Record<StatusServico, string> = {
  aguardando_aprovacao: 'border-white/10 bg-sky-900/20',
  abertura_servico: 'border-white/10 bg-sky-900/20',
  elaboracao_documentacao: 'border-white/10 bg-sky-900/20',
  aguardando_assinatura_cliente: 'border-white/10 bg-sky-900/20',
  aguardando_protocolo_concessionaria: 'border-white/10 bg-sky-900/20',
  em_analise_concessionaria: 'border-white/10 bg-sky-900/20',
  ressalvas: 'border-white/10 bg-sky-900/20',
  obras_concessionaria: 'border-white/10 bg-sky-900/20',
  servico_aprovado: 'border-white/10 bg-sky-900/20',
  vistoria_solicitada: 'border-white/10 bg-sky-900/20',
  vistoria_reprovada: 'border-white/10 bg-sky-900/20',
  servico_encerrado: 'border-white/10 bg-sky-900/20',
};

export const getTipoLabel = (tipo: TipoServico) =>
  tipoServicoOptions.find((item) => item.value === tipo)?.label ?? tipo;

export const isTechnicalType = (tipo: TipoServico) =>
  tipo === 'ligacao_nova' || tipo === 'aumento_carga' || tipo === 'troca_titularidade';

export const canUseRateioType = (tipo: TipoServico) =>
  tipo === 'alteracao_compartilhamento_credito';
