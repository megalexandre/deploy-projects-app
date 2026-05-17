export type Passo = 1 | 2 | 3;
export type TipoDocumento = 'cpf' | 'cnpj';
export type ModoCliente = 'novo' | 'existente';
export type TipoProjeto = 'fotovoltaico' | 'padrao_entrada';
export type ModoEnderecoProjeto = 'cliente' | 'novo';

export interface EnderecoForm {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

export interface DadosBasicosForm {
  dataAbertura: string;
  concessionaria: string;
  numeroUc: string;
  tipoProjeto: TipoProjeto | '';
  integrador: string;
}

export interface ClienteForm {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  endereco: EnderecoForm;
}

export interface DadosDetalhesForm {
  modalidadeGeracao: 'autoconsumo_local' | 'autoconsumo_remoto' | 'geracao_compartilhada';
  projetoFastTrack: 'sim' | 'nao';
  projetoNovo: 'sim' | 'nao_ampliacao';
  zeroGridControleExportacao: 'nao' | 'sim';
  linkMapa: string;
  coordenadas: {
    latitude: string;
    longitude: string;
  };
  tensaoFornecimento: '127/220V' | '380/220V' | '';
  observacoes: string;
}

export interface ItemEquipamentoForm {
  id: string;
  quantidade: string;
  potencia: string;
  marca: string;
  modelo: string;
}

export interface DocumentoCategoria {
  key: string;
  label: string;
  maxFiles?: number;
}

export interface DocumentoSelecionado {
  categoria: string;
  file: File;
}

export interface PadraoEntradaItemForm {
  id: string;
  tipoLigacao: string;
  classificacao: string;
  quantidade: string;
  disjuntor: string;
}
