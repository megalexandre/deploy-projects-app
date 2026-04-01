import type { ConfiguracoesSistema, CupomDesconto, PrecoPadraoEntrada } from '../types';

const STORAGE_KEY = 'opj_configuracoes_sistema';

const defaultTabelaPrecoFotovoltaico = [
  { id: 'fv-1', min: 0, max: 10, valor: 600 },
  { id: 'fv-2', min: 10.1, max: 15, valor: 800 },
  { id: 'fv-3', min: 15.1, max: 30, valor: 1000 },
  { id: 'fv-4', min: 30.1, max: 50, valor: 1300 },
  { id: 'fv-5', min: 50.1, max: 75, valor: 1600 },
  { id: 'fv-6', min: 75.1, max: 150, valor: 4000 },
  { id: 'fv-7', min: 150.1, max: 300, valor: 9000 }
];

const defaultTabelaPrecoPadraoEntrada: PrecoPadraoEntrada[] = [
  { id: 'emuc-1', classificacao: 'Residencial', tipoLigacao: 'Monofasico', valor: 150 },
  { id: 'emuc-2', classificacao: 'Residencial', tipoLigacao: 'Bifasico', valor: 250 },
  { id: 'emuc-3', classificacao: 'Residencial', tipoLigacao: 'Trifasico', valor: 300 },
  { id: 'emuc-4', classificacao: 'Comercial / Industrial', tipoLigacao: 'Monofasico', valor: 250 },
  { id: 'emuc-5', classificacao: 'Comercial / Industrial', tipoLigacao: 'Bifasico', valor: 300 },
  { id: 'emuc-6', classificacao: 'Comercial / Industrial', tipoLigacao: 'Trifasico', valor: 350 },
  { id: 'emuc-7', classificacao: 'Condominio', tipoLigacao: 'Monofasico', valor: 150 },
  { id: 'emuc-8', classificacao: 'Condominio', tipoLigacao: 'Bifasico', valor: 200 },
  { id: 'emuc-9', classificacao: 'Condominio', tipoLigacao: 'Trifasico', valor: 300 }
];

const defaultCuponsDesconto: CupomDesconto[] = [{ id: 'cupom-10', nome: 'Cupom 10%', percentual: 10, ativo: true }];

export const getDefaultConfiguracoesSistema = (): ConfiguracoesSistema => ({
  nomeEmpresa: 'OPJ Engenharia',
  cnpj: '12.345.678/0001-99',
  telefone: '(11) 3456-7890',
  email: 'contato@opjengenharia.com.br',
  endereco: 'Rua das Industrias, 1234 - Sao Paulo/SP',
  emailNotificacoes: true,
  smsNotificacoes: false,
  notificacoesProjetos: true,
  notificacoesFinanceiro: true,
  notificacoesServicos: false,
  tema: 'dark',
  idioma: 'pt-BR',
  fusoHorario: 'America/Sao_Paulo',
  formatoData: 'DD/MM/YYYY',
  backupAutomatico: true,
  frequenciaBackup: 'diario',
  retencaoBackup: '30',
  tabelaPrecoFotovoltaico: defaultTabelaPrecoFotovoltaico,
  tabelaPrecoPadraoEntrada: defaultTabelaPrecoPadraoEntrada,
  cuponsDesconto: defaultCuponsDesconto
});

const sanitizeNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeConfig = (raw: Partial<ConfiguracoesSistema> | null | undefined): ConfiguracoesSistema => {
  const defaults = getDefaultConfiguracoesSistema();

  return {
    ...defaults,
    ...raw,
    tabelaPrecoFotovoltaico: Array.isArray(raw?.tabelaPrecoFotovoltaico) && raw.tabelaPrecoFotovoltaico.length > 0
      ? raw.tabelaPrecoFotovoltaico.map((item, index) => ({
          id: item.id || `fv-${index + 1}`,
          min: sanitizeNumber(item.min),
          max: sanitizeNumber(item.max),
          valor: sanitizeNumber(item.valor)
        }))
      : defaults.tabelaPrecoFotovoltaico,
    tabelaPrecoPadraoEntrada: Array.isArray(raw?.tabelaPrecoPadraoEntrada) && raw.tabelaPrecoPadraoEntrada.length > 0
      ? raw.tabelaPrecoPadraoEntrada.map((item, index) => ({
          id: item.id || `emuc-${index + 1}`,
          classificacao: item.classificacao || '',
          tipoLigacao: item.tipoLigacao || '',
          valor: sanitizeNumber(item.valor)
        }))
      : defaults.tabelaPrecoPadraoEntrada,
    cuponsDesconto: Array.isArray(raw?.cuponsDesconto) && raw.cuponsDesconto.length > 0
      ? raw.cuponsDesconto.map((item, index) => ({
          id: item.id || `cupom-${index + 1}`,
          nome: item.nome || `Cupom ${index + 1}`,
          percentual: sanitizeNumber(item.percentual),
          ativo: item.ativo !== false
        }))
      : defaults.cuponsDesconto
  };
};

export const loadConfiguracoesSistema = (): ConfiguracoesSistema => {
  if (typeof window === 'undefined') {
    return getDefaultConfiguracoesSistema();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultConfiguracoesSistema();
    }

    return normalizeConfig(JSON.parse(raw) as Partial<ConfiguracoesSistema>);
  } catch {
    return getDefaultConfiguracoesSistema();
  }
};

export const saveConfiguracoesSistema = (config: ConfiguracoesSistema) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeConfig(config)));
};

export const buildTabelaPrecoPadraoEntradaMap = (items: PrecoPadraoEntrada[]) =>
  items.reduce<Record<string, number>>((acc, item) => {
    acc[`${item.classificacao}|${item.tipoLigacao}`] = sanitizeNumber(item.valor);
    return acc;
  }, {});

export const getCuponsDescontoAtivos = (config: ConfiguracoesSistema) =>
  config.cuponsDesconto.filter((item) => item.ativo && sanitizeNumber(item.percentual) > 0);
