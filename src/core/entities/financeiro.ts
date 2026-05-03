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
  tabelaPrecoFotovoltaico: FaixaPrecoFotovoltaico[];
  tabelaPrecoPadraoEntrada: PrecoPadraoEntrada[];
  cuponsDesconto: CupomDesconto[];
}
