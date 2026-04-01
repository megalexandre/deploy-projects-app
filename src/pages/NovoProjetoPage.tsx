/** Pagina 'NovoProjetoPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, MagnifyingGlass, UploadSimple, Plus } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import {
  ApiError,
  addressService,
  concessionariasService,
  customersService,
  projectsService,
  viaCepService,
  type Concessionaria,
  type CreateProjectData,
  type Customer
} from '../services';
import { buildTabelaPrecoPadraoEntradaMap, loadConfiguracoesSistema } from '../utils/configuracoesSistema';
import { formatCurrencyBRL, maskCep, maskCnpj, maskCpf, maskCpfOrCnpj, maskLatitude, maskLongitude, maskNumeric, maskPhoneBR, onlyDigits, parseCoordinate } from '../utils/masks';

type Passo = 1 | 2 | 3;
type TipoDocumento = 'cpf' | 'cnpj';
type ModoCliente = 'novo' | 'existente';
type TipoProjeto = 'fotovoltaico' | 'padrao_entrada';
type ModoEnderecoProjeto = 'cliente' | 'novo';

interface EnderecoForm {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface DadosBasicosForm {
  dataAbertura: string;
  concessionaria: string;
  numeroUc: string;
  tipoProjeto: TipoProjeto | '';
  integrador: string;
}

interface ClienteForm {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  endereco: EnderecoForm;
}

interface DadosDetalhesForm {
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

interface ItemEquipamentoForm {
  id: string;
  quantidade: string;
  potencia: string;
  marca: string;
  modelo: string;
}

interface DocumentoCategoria {
  key: string;
  label: string;
  maxFiles?: number;
}

interface PadraoEntradaItemForm {
  id: string;
  tipoLigacao: string;
  classificacao: string;
  quantidade: string;
  disjuntor: string;
}

const integradores = ['Selecione...', 'OPJ Engenharia', 'Parceiro Externo'];
const tiposProjeto = [
  { value: 'fotovoltaico' as const, label: 'Projeto fotovoltaico' },
  { value: 'padrao_entrada' as const, label: 'Padrao de entrada' }
];
const servicosDisponiveis = [
  'Ligacao Nova',
  'Aumento de Carga',
  'Troca de Titularidade',
  'Alteracao no Compartilhamento de creditos',
  'Projeto Eletrico'
];

const documentosFotovoltaico: DocumentoCategoria[] = [
  { key: 'fatura_energia', label: 'Fatura de Energia' },
  { key: 'procuracao', label: 'Procuracao' },
  { key: 'documento_titular', label: 'Documento Titular' },
  { key: 'foto_padrao_entrada', label: 'Foto Padrao de Entrada' },
  { key: 'foto_disjuntor_geral', label: 'Foto Disjuntor Geral' },
  { key: 'foto_interconexao', label: 'Foto Interconexao' },
  { key: 'numero_poste_tr', label: 'Numero do Poste / TR' },
  { key: 'outros', label: 'Outros', maxFiles: 10 }
];

const documentosEmucPessoaFisica: DocumentoCategoria[] = [
  { key: 'carta_prefeitura', label: 'Carta da prefeitura / habite-se' },
  { key: 'matricula_imovel', label: 'Matricula do Imovel' },
  { key: 'projeto_edificacao', label: 'Projeto da edificacao', maxFiles: 3 },
  { key: 'foto_padrao_instalado', label: 'Foto do padrao instalado', maxFiles: 3 },
  { key: 'foto_numero_poste', label: 'Foto do poste / transformador', maxFiles: 3 },
  { key: 'documento_cnh', label: 'CNH' },
  { key: 'documento_procuracao', label: 'Procuracao' },
  { key: 'conta_luz_terreno', label: 'Conta de luz do terreno' },
  { key: 'outros', label: 'Outros', maxFiles: 10 }
];

const documentosEmucPessoaJuridica: DocumentoCategoria[] = [
  { key: 'carta_prefeitura', label: 'Carta da prefeitura / habite-se' },
  { key: 'matricula_imovel', label: 'Matricula do Imovel' },
  { key: 'projeto_edificacao', label: 'Projeto da edificacao', maxFiles: 3 },
  { key: 'foto_padrao_instalado', label: 'Foto do padrao instalado', maxFiles: 3 },
  { key: 'foto_numero_poste', label: 'Foto do poste / transformador', maxFiles: 3 },
  { key: 'contrato_social', label: 'Contrato Social' },
  { key: 'cartao_cnpj', label: 'Cartao CNPJ' },
  { key: 'documentacao_socios', label: 'Documentacao dos socios', maxFiles: 5 },
  { key: 'documento_procuracao', label: 'Procuracao' },
  { key: 'conta_luz_terreno', label: 'Conta de luz do terreno' },
  { key: 'outros', label: 'Outros', maxFiles: 10 }
];

const padraoEntradaLinhasBase: Array<Pick<PadraoEntradaItemForm, 'tipoLigacao' | 'classificacao'>> = [
  { tipoLigacao: 'Monofasico', classificacao: 'Residencial' },
  { tipoLigacao: 'Bifasico', classificacao: 'Residencial' },
  { tipoLigacao: 'Trifasico', classificacao: 'Residencial' },
  { tipoLigacao: 'Monofasico', classificacao: 'Comercial / Industrial' },
  { tipoLigacao: 'Bifasico', classificacao: 'Comercial / Industrial' },
  { tipoLigacao: 'Trifasico', classificacao: 'Comercial / Industrial' },
  { tipoLigacao: 'Monofasico', classificacao: 'Condominio' },
  { tipoLigacao: 'Bifasico', classificacao: 'Condominio' },
  { tipoLigacao: 'Trifasico', classificacao: 'Condominio' }
];

const isValidLatitude = (value: string): boolean => {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -90 && parsed <= 90;
};

const isValidLongitude = (value: string): boolean => {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -180 && parsed <= 180;
};

const buildItemVazio = (): ItemEquipamentoForm => ({
  id: crypto.randomUUID(),
  quantidade: '',
  potencia: '',
  marca: '',
  modelo: ''
});

const buildPadraoEntradaLinhas = (): PadraoEntradaItemForm[] =>
  padraoEntradaLinhasBase.map((item) => ({
    id: crypto.randomUUID(),
    tipoLigacao: item.tipoLigacao,
    classificacao: item.classificacao,
    quantidade: '',
    disjuntor: ''
  }));

const buildEnderecoVazio = (): EnderecoForm => ({
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: ''
});

const dataAtualIso = new Date().toISOString().split('T')[0];
const buildEnderecoCompleto = (endereco: EnderecoForm): string =>
  [
    `${endereco.logradouro.trim()}${endereco.numero.trim() ? `, ${endereco.numero.trim()}` : ''}`,
    endereco.complemento.trim(),
    endereco.bairro.trim(),
    `${endereco.cidade.trim()}${endereco.estado.trim() ? ` - ${endereco.estado.trim().toUpperCase()}` : ''}`,
    onlyDigits(endereco.cep).length === 8 ? `CEP ${maskCep(endereco.cep)}` : ''
  ]
    .filter(Boolean)
    .join(', ');

const formatDocumento = (value: string) => maskCpfOrCnpj(value);
const formatTelefone = (value: string) => maskPhoneBR(onlyDigits(value));
const getTipoDocumentoPorValor = (value?: string): TipoDocumento => (onlyDigits(value ?? '').length > 11 ? 'cnpj' : 'cpf');
const parseCurrencyInput = (value: string) => {
  const normalized = value.includes(',')
    ? value.replace(/\./g, '').replace(',', '.')
    : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const getFaixaFotovoltaicaValor = (potenciaKw: number, faixas: Array<{ min: number; max: number; valor: number }>) => {
  if (!Number.isFinite(potenciaKw) || potenciaKw <= 0 || faixas.length === 0) {
    return 0;
  }

  const ordered = [...faixas].sort((a, b) => a.min - b.min);

  for (let index = 0; index < ordered.length; index += 1) {
    const faixa = ordered[index];
    const nextFaixa = ordered[index + 1];
    const estaDentroDaFaixa = potenciaKw >= faixa.min && potenciaKw <= faixa.max;
    const estaNoIntervaloAteProximaFaixa = potenciaKw >= faixa.min && (!nextFaixa || potenciaKw < nextFaixa.min);

    if (estaDentroDaFaixa || estaNoIntervaloAteProximaFaixa) {
      return faixa.valor;
    }
  }

  return ordered[ordered.length - 1]?.valor ?? 0;
};
const enderecoValido = (endereco: EnderecoForm) =>
  onlyDigits(endereco.cep).length === 8 &&
  endereco.logradouro.trim().length >= 3 &&
  endereco.numero.trim().length >= 1 &&
  endereco.bairro.trim().length >= 2 &&
  endereco.cidade.trim().length >= 2 &&
  endereco.estado.trim().length === 2;

const normalizeEnderecoForm = (endereco?: Customer['endereco']): EnderecoForm =>
  endereco
    ? {
        cep: endereco.cep ?? '',
        logradouro: endereco.logradouro ?? '',
        numero: endereco.numero ?? '',
        complemento: endereco.complemento ?? '',
        bairro: endereco.bairro ?? '',
        cidade: endereco.cidade ?? '',
        estado: endereco.estado ?? ''
      }
    : buildEnderecoVazio();

export const NovoProjetoPage: React.FC = () => {
  const navigate = useNavigate();
  const [passoAtual, setPassoAtual] = useState<Passo>(1);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [modoCliente, setModoCliente] = useState<ModoCliente | null>(null);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [concessionarias, setConcessionarias] = useState<Concessionaria[]>([]);
  const [concessionariasLoading, setConcessionariasLoading] = useState(false);
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [clienteSelecionadoDetalhe, setClienteSelecionadoDetalhe] = useState<Customer | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [dadosBasicos, setDadosBasicos] = useState<DadosBasicosForm>({
    dataAbertura: dataAtualIso,
    concessionaria: '',
    numeroUc: '',
    tipoProjeto: '',
    integrador: ''
  });
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [modoEnderecoProjeto, setModoEnderecoProjeto] = useState<ModoEnderecoProjeto>('cliente');
  const [enderecoProjeto, setEnderecoProjeto] = useState<EnderecoForm>(buildEnderecoVazio());

  const [clienteForm, setClienteForm] = useState<ClienteForm>({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    email: '',
    endereco: buildEnderecoVazio()
  });

  const [detalhesProjeto, setDetalhesProjeto] = useState<DadosDetalhesForm>({
    modalidadeGeracao: 'autoconsumo_local',
    projetoFastTrack: 'nao',
    projetoNovo: 'sim',
    zeroGridControleExportacao: 'nao',
    linkMapa: '',
    coordenadas: {
      latitude: '',
      longitude: ''
    },
    tensaoFornecimento: '',
    observacoes: ''
  });

  const [modulos, setModulos] = useState<ItemEquipamentoForm[]>([buildItemVazio()]);
  const [inversores, setInversores] = useState<ItemEquipamentoForm[]>([buildItemVazio()]);
  const [padraoEntradaItens, setPadraoEntradaItens] = useState<PadraoEntradaItemForm[]>(buildPadraoEntradaLinhas());
  const [documentos, setDocumentos] = useState<Record<string, File[]>>({});
  const [configuracoesSistema] = useState(() => loadConfiguracoesSistema());
  const [valorProjeto, setValorProjeto] = useState('');
  const [valorProjetoEditado, setValorProjetoEditado] = useState(false);

  const tabelaPrecoPadraoEntradaMap = useMemo(
    () => buildTabelaPrecoPadraoEntradaMap(configuracoesSistema.tabelaPrecoPadraoEntrada),
    [configuracoesSistema.tabelaPrecoPadraoEntrada]
  );

  const potenciaTotalModulosW = useMemo(
    () =>
      modulos.reduce((total, modulo) => {
        const quantidade = Number(modulo.quantidade) || 0;
        const potencia = Number(modulo.potencia) || 0;
        return total + quantidade * potencia;
      }, 0),
    [modulos]
  );

  const potenciaTotalInversoresW = useMemo(
    () =>
      inversores.reduce((total, inversor) => {
        const quantidade = Number(inversor.quantidade) || 0;
        const potencia = Number(inversor.potencia) || 0;
        return total + quantidade * potencia;
      }, 0),
    [inversores]
  );

  const potenciaTotalSistemaW = useMemo(() => {
    if (potenciaTotalModulosW > 0 && potenciaTotalInversoresW > 0) {
      return Math.min(potenciaTotalModulosW, potenciaTotalInversoresW);
    }

    return Math.max(potenciaTotalModulosW, potenciaTotalInversoresW);
  }, [potenciaTotalInversoresW, potenciaTotalModulosW]);

  const potenciaTotalSistemaKw = useMemo(() => Number((potenciaTotalSistemaW / 1000).toFixed(2)), [potenciaTotalSistemaW]);

  const precoFotovoltaicoAtual = useMemo(
    () => getFaixaFotovoltaicaValor(potenciaTotalSistemaKw, configuracoesSistema.tabelaPrecoFotovoltaico),
    [configuracoesSistema.tabelaPrecoFotovoltaico, potenciaTotalSistemaKw]
  );

  const custoCalculadoProjeto = useMemo(() => {
    if (dadosBasicos.tipoProjeto === 'fotovoltaico') {
      return precoFotovoltaicoAtual;
    }

    return padraoEntradaItens.reduce((total, item) => {
      const quantidade = Number(item.quantidade) || 0;
      const valorUnitario = tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0;
      return total + quantidade * valorUnitario;
    }, 0);
  }, [dadosBasicos.tipoProjeto, padraoEntradaItens, precoFotovoltaicoAtual, tabelaPrecoPadraoEntradaMap]);

  useEffect(() => {
    if (!valorProjetoEditado) {
      setValorProjeto(String(custoCalculadoProjeto));
    }
  }, [custoCalculadoProjeto, valorProjetoEditado]);

  const valorProjetoNumerico = useMemo(() => {
    return parseCurrencyInput(valorProjeto);
  }, [valorProjeto]);

  const tipoDocumentoCliente = useMemo(() => {
    if (modoCliente === 'novo') {
      return tipoDocumento;
    }

    const cliente = clientes.find((item) => item.id === clienteSelecionadoId);
    return getTipoDocumentoPorValor(cliente?.cpfCnpj);
  }, [clienteSelecionadoId, clientes, modoCliente, tipoDocumento]);

  const documentosTemplate = useMemo(() => {
    if (dadosBasicos.tipoProjeto === 'padrao_entrada') {
      return tipoDocumentoCliente === 'cnpj' ? documentosEmucPessoaJuridica : documentosEmucPessoaFisica;
    }

    return documentosFotovoltaico;
  }, [dadosBasicos.tipoProjeto, tipoDocumentoCliente]);

  useEffect(() => {
    setDocumentos((prev) =>
      documentosTemplate.reduce<Record<string, File[]>>((acc, item) => {
        acc[item.key] = prev[item.key] ?? [];
        return acc;
      }, {})
    );
  }, [documentosTemplate]);

  const clientesFiltrados = useMemo(() => {
    const query = buscaCliente.trim().toLowerCase();
    if (!query) {
      return clientes;
    }

    return clientes.filter((cliente) => {
      return (
        cliente.nome.toLowerCase().includes(query) ||
        onlyDigits(cliente.cpfCnpj).includes(onlyDigits(query)) ||
        cliente.email.toLowerCase().includes(query) ||
        onlyDigits(cliente.telefone).includes(onlyDigits(query))
      );
    });
  }, [buscaCliente, clientes]);

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteSelecionadoId) ?? null,
    [clienteSelecionadoId, clientes]
  );
  const enderecoClienteProjeto = useMemo(() => {
    if (modoCliente === 'novo') {
      return clienteForm.endereco;
    }

    return normalizeEnderecoForm(clienteSelecionadoDetalhe?.endereco);
  }, [clienteForm.endereco, clienteSelecionadoDetalhe?.endereco, modoCliente]);
  const enderecoProjetoAtual = modoEnderecoProjeto === 'cliente' ? enderecoClienteProjeto : enderecoProjeto;
  const enderecoClienteDisponivel = enderecoValido(enderecoClienteProjeto);

  const fillAddressFromCep = async (
    cep: string,
    updater: (address: { cep: string; logradouro: string; complemento: string; bairro: string; cidade: string; estado: string }) => void
  ) => {
    if (onlyDigits(cep).length !== 8) {
      return;
    }

    try {
      const endereco = await viaCepService.lookup(cep);
      if (!endereco) {
        return;
      }

      updater(endereco);
    } catch (lookupError) {
      console.error('Erro ao consultar CEP:', lookupError);
    }
  };

  useEffect(() => {
    const loadConcessionarias = async () => {
      setConcessionariasLoading(true);
      try {
        setConcessionarias(await concessionariasService.getActive());
      } catch (loadError) {
        console.error('Erro ao carregar concessionarias:', loadError);
        setErro('Nao foi possivel carregar as concessionarias disponiveis.');
      } finally {
        setConcessionariasLoading(false);
      }
    };

    void loadConcessionarias();
  }, []);

  useEffect(() => {
    if (modoCliente !== 'existente') {
      return;
    }

    const loadClientes = async () => {
      setClientesLoading(true);
      try {
        const response = await customersService.getAll();
        setClientes(response);
      } catch (loadError) {
        console.error('Erro ao carregar clientes:', loadError);
        setErro('Nao foi possivel carregar os clientes cadastrados.');
      } finally {
        setClientesLoading(false);
      }
    };

    void loadClientes();
  }, [modoCliente]);

  useEffect(() => {
    if (modoCliente !== 'existente' || !clienteSelecionadoId) {
      setClienteSelecionadoDetalhe(null);
      return;
    }

    const loadClienteDetalhe = async () => {
      try {
        const customer = await customersService.getById(clienteSelecionadoId);
        setClienteSelecionadoDetalhe(customer);
      } catch (loadError) {
        console.error('Erro ao carregar detalhes do cliente selecionado:', loadError);
        setErro('Nao foi possivel carregar o endereco do cliente selecionado.');
      }
    };

    void loadClienteDetalhe();
  }, [clienteSelecionadoId, modoCliente]);

  const handleModuloChange = (id: string, field: keyof ItemEquipamentoForm, value: string) => {
    setModulos((prev) =>
      prev.map((modulo) => (modulo.id === id ? { ...modulo, [field]: value } : modulo))
    );
  };

  const handleInversorChange = (id: string, field: keyof ItemEquipamentoForm, value: string) => {
    setInversores((prev) =>
      prev.map((inversor) => (inversor.id === id ? { ...inversor, [field]: value } : inversor))
    );
  };

  const handlePadraoEntradaChange = (id: string, field: 'quantidade' | 'disjuntor', value: string) => {
    setPadraoEntradaItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDocumentosChange = (key: string, files: FileList | null) => {
    const categoria = documentosTemplate.find((item) => item.key === key);
    if (!categoria) {
      return;
    }

    const selecionados = Array.from(files ?? []);
    const limitados = categoria.maxFiles ? selecionados.slice(0, categoria.maxFiles) : selecionados.slice(0, 1);

    setDocumentos((prev) => ({
      ...prev,
      [key]: limitados
    }));
  };

  const buildDocumentosPayload = () =>
    documentosTemplate.flatMap((categoria) =>
      (documentos[categoria.key] ?? []).map((file) => ({
        id: crypto.randomUUID(),
        nome: file.name,
        tipo: categoria.label,
        dataUpload: new Date().toISOString(),
        tamanho: file.size
      }))
    );

  const buildModulosPayload = () =>
    modulos
      .filter((item) => Number(item.quantidade) > 0 && Number(item.potencia) > 0)
      .map((item) => {
        const quantidade = Number(item.quantidade);
        const potencia = Number(item.potencia);

        return {
          id: item.id,
          fabricante: item.marca.trim() || '-',
          modelo: item.modelo.trim() || '-',
          potencia,
          quantidade,
          potenciaPico: Number(((quantidade * potencia) / 1000).toFixed(2))
        };
      });

  const buildInversoresPayload = () =>
    inversores
      .filter((item) => Number(item.quantidade) > 0 && Number(item.potencia) > 0)
      .map((item) => {
        const quantidade = Number(item.quantidade);
        const potencia = Number(item.potencia);

        return {
          id: item.id,
          fabricante: item.marca.trim() || '-',
          modelo: item.modelo.trim() || '-',
          potencia,
          quantidade,
          potenciaTotal: Number(((quantidade * potencia) / 1000).toFixed(2))
        };
      });

  const validarPasso1 = () => {
    if (!modoCliente) {
      return false;
    }

    if (modoCliente === 'existente') {
      return Boolean(clienteSelecionadoId);
    }

    const documentoLimpo = onlyDigits(clienteForm.cpfCnpj);
    const tamanhoDocumentoValido = tipoDocumento === 'cpf' ? 11 : 14;
    const telefoneValido = onlyDigits(clienteForm.telefone).length >= 10;
    const nomeValido = clienteForm.nome.trim().length >= 2;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteForm.email.trim());
    return (
      nomeValido &&
      emailValido &&
      documentoLimpo.length === tamanhoDocumentoValido &&
      telefoneValido &&
      enderecoValido(clienteForm.endereco)
    );
  };

  const validarPasso2 = () => {
    const camposObrigatorios = [dadosBasicos.dataAbertura, dadosBasicos.concessionaria, dadosBasicos.numeroUc];

    return camposObrigatorios.every((campo) => campo.trim() !== '') && dadosBasicos.tipoProjeto !== '' && enderecoValido(enderecoProjetoAtual);
  };

  const validarPasso3 = () => {
    const coordenadasValidas =
      isValidLatitude(detalhesProjeto.coordenadas.latitude) && isValidLongitude(detalhesProjeto.coordenadas.longitude);

    if (!coordenadasValidas || dadosBasicos.integrador.trim() === '' || servicosSelecionados.length === 0) {
      return false;
    }

    if (dadosBasicos.tipoProjeto === 'fotovoltaico') {
      return potenciaTotalModulosW > 0 && potenciaTotalInversoresW > 0 && potenciaTotalSistemaW > 0;
    }

    const temPadraoPreenchido = padraoEntradaItens.some(
      (item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== ''
    );

    return detalhesProjeto.tensaoFornecimento !== '' && temPadraoPreenchido;
  };

  const gerarProtocolo = () => {
    const ano = new Date().getFullYear();
    const sufixo = String(Date.now()).slice(-4);
    return `PROT-${ano}-${sufixo}`;
  };

  const handleCriarProjeto = async () => {
    if (!validarPasso1()) {
      setErro('Preencha todos os campos obrigatorios do Passo 1 antes de criar o projeto.');
      setPassoAtual(1);
      return;
    }

    if (!validarPasso2()) {
      setErro('Preencha os campos obrigatorios do Passo 2 antes de criar o projeto.');
      setPassoAtual(2);
      return;
    }

    if (!modoCliente) {
      setErro('Selecione se o cliente e novo ou ja cadastrado no Passo 1.');
      setPassoAtual(1);
      return;
    }

    const projetoFotovoltaico = dadosBasicos.tipoProjeto === 'fotovoltaico';
    const potenciaSistemaKw = potenciaTotalSistemaKw;
    if (!validarPasso3()) {
      setErro(
        projetoFotovoltaico
          ? 'Preencha latitude e longitude em formato valido, alem de modulos e inversores, para calcular corretamente a potencia do sistema.'
          : 'Preencha tensao, latitude e longitude em formato valido e ao menos uma linha do quadro de padrao de entrada.'
      );
      setPassoAtual(3);
      return;
    }

    setErro(null);
    setSalvando(true);

    try {
      let clienteId = clienteSelecionadoId;
      let clienteAddressId = clienteSelecionadoDetalhe?.addressId ?? null;

      if (modoCliente === 'novo') {
        const enderecoCliente = await addressService.create({
          cep: onlyDigits(clienteForm.endereco.cep),
          place: clienteForm.endereco.logradouro.trim(),
          number: clienteForm.endereco.numero.trim(),
          address: clienteForm.endereco.logradouro.trim(),
          complement: clienteForm.endereco.complemento.trim(),
          neighborhood: clienteForm.endereco.bairro.trim(),
          city: clienteForm.endereco.cidade.trim(),
          state: clienteForm.endereco.estado.trim().toLowerCase(),
          link: ''
        });

        const novoCliente = await customersService.create({
          nome: clienteForm.nome.trim(),
          addressId: enderecoCliente.id,
          cpfCnpj: onlyDigits(clienteForm.cpfCnpj),
          telefone: onlyDigits(clienteForm.telefone),
          email: clienteForm.email.trim()
        });
        clienteId = novoCliente.id;
        clienteAddressId = novoCliente.addressId ?? enderecoCliente.id;
      }

      if (!clienteId) {
        setErro('Selecione um cliente cadastrado para continuar.');
        setPassoAtual(1);
        return;
      }

      let enderecoProjetoId = clienteAddressId;
      if (modoEnderecoProjeto === 'novo') {
        const latitudeMapa = maskLatitude(detalhesProjeto.coordenadas.latitude);
        const longitudeMapa = maskLongitude(detalhesProjeto.coordenadas.longitude);
        const enderecoProjetoCriado = await addressService.create({
          cep: onlyDigits(enderecoProjetoAtual.cep),
          place: enderecoProjetoAtual.logradouro.trim(),
          number: enderecoProjetoAtual.numero.trim(),
          address: enderecoProjetoAtual.logradouro.trim(),
          complement: enderecoProjetoAtual.complemento.trim(),
          neighborhood: enderecoProjetoAtual.bairro.trim(),
          city: enderecoProjetoAtual.cidade.trim(),
          state: enderecoProjetoAtual.estado.trim().toLowerCase(),
          link:
            detalhesProjeto.linkMapa.trim() ||
            `https://maps.google.com/?q=${encodeURIComponent(
              `${latitudeMapa},${longitudeMapa}`
            )}`
        });
        enderecoProjetoId = enderecoProjetoCriado.id;
      }

      if (modoEnderecoProjeto === 'cliente' && !enderecoProjetoId) {
        setErro('O cliente selecionado nao possui endereco vinculado. Cadastre um novo endereco para o projeto.');
        setPassoAtual(2);
        return;
      }

      const documentoCliente =
        modoCliente === 'novo' ? onlyDigits(clienteForm.cpfCnpj) : onlyDigits(clienteSelecionado?.cpfCnpj ?? '');
      const classe = documentoCliente.length === 14 ? 'Comercial' : 'Residencial';
      const modalidade = projetoFotovoltaico
        ? detalhesProjeto.modalidadeGeracao === 'autoconsumo_local'
          ? 'AUTOCONSUMO LOCAL'
          : detalhesProjeto.modalidadeGeracao === 'autoconsumo_remoto'
            ? 'AUTOCONSUMO REMOTO'
            : 'GERACAO COMPARTILHADA'
        : 'Padrao de Entrada';
      const enquadramento = projetoFotovoltaico
        ? potenciaSistemaKw <= 75
          ? 'Microgeracao'
          : 'Minigeracao'
        : 'Padrao de Entrada';
      const latitudeFormatada = maskLatitude(detalhesProjeto.coordenadas.latitude);
      const longitudeFormatada = maskLongitude(detalhesProjeto.coordenadas.longitude);
      const latitudeNumero = parseCoordinate(latitudeFormatada);
      const longitudeNumero = parseCoordinate(longitudeFormatada);

      if (latitudeNumero === null || longitudeNumero === null) {
        setErro('Latitude ou longitude informada em formato invalido.');
        setPassoAtual(3);
        return;
      }

      const projectData: CreateProjectData = {
        id: crypto.randomUUID(),
        clientId: clienteId,
        addressId: enderecoProjetoId ?? undefined,
        nomeCliente: modoCliente === 'novo' ? clienteForm.nome.trim() : (clienteSelecionado?.nome ?? ''),
        utilityCompany: dadosBasicos.concessionaria,
        utilityProtocol: gerarProtocolo(),
        customerClass: classe,
        integrator: dadosBasicos.integrador,
        modality: modalidade,
        framework: enquadramento,
        dcProtection: projetoFotovoltaico ? 'Disjuntor CC 20A' : undefined,
        systemPower: projetoFotovoltaico ? potenciaSistemaKw : 0,
        status: 'em_analise_documentacao',
        amount: valorProjetoNumerico,
        projectType: dadosBasicos.tipoProjeto,
        servicesNames: servicosSelecionados,
        unitControl: dadosBasicos.numeroUc,
        latitude: latitudeFormatada,
        longitude: longitudeFormatada,
        tensaoFornecimento: projetoFotovoltaico ? undefined : detalhesProjeto.tensaoFornecimento,
        padraoEntradaItens: projetoFotovoltaico
          ? []
          : padraoEntradaItens
              .filter((item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== '')
              .map((item) => ({
                id: item.id,
                tipoLigacao: item.tipoLigacao,
                classificacao: item.classificacao,
                quantidade: Number(item.quantidade) || 0,
                disjuntor: item.disjuntor.trim()
              })),
        modulos: projetoFotovoltaico ? buildModulosPayload() : [],
        inversores: projetoFotovoltaico ? buildInversoresPayload() : [],
        documentos: buildDocumentosPayload(),
        enderecoCompleto: buildEnderecoCompleto(enderecoProjetoAtual),
        dataAbertura: dadosBasicos.dataAbertura,
        coordinates: {
          latitude: latitudeFormatada,
          longitude: longitudeFormatada
        },
        fastTrack: projetoFotovoltaico ? detalhesProjeto.projetoFastTrack : 'nao',
        projetoNovo: detalhesProjeto.projetoNovo,
        zeroGridControleExportacao: projetoFotovoltaico ? detalhesProjeto.zeroGridControleExportacao : 'nao',
        description: detalhesProjeto.observacoes.trim()
      };

      console.log('Dados do formulario:', {
        modoCliente,
        concessionaria: dadosBasicos.concessionaria,
        integrador: dadosBasicos.integrador,
        clienteId,
        nomeCliente: modoCliente === 'novo' ? clienteForm.nome : clienteSelecionado?.nome,
        numeroUc: dadosBasicos.numeroUc,
        tipoProjeto: dadosBasicos.tipoProjeto,
        servicosSelecionados,
        modalidadeGeracao: detalhesProjeto.modalidadeGeracao,
        tensaoFornecimento: detalhesProjeto.tensaoFornecimento,
        projetoFastTrack: detalhesProjeto.projetoFastTrack,
        projetoNovo: detalhesProjeto.projetoNovo,
        zeroGridControleExportacao: detalhesProjeto.zeroGridControleExportacao,
        latitude: latitudeFormatada,
        longitude: longitudeFormatada,
        potenciaSistemaKw
      });
      console.log('Enviando dados para API:', projectData);
      await projectsService.create(projectData);

      navigate('/projetos');
    } catch (creationError) {
      console.error('Erro ao criar projeto:', creationError);
      if (creationError instanceof ApiError) {
        console.error('Detalhes do erro:', creationError.payload);
        if (creationError.status === 401 || creationError.status === 403) {
          setErro('Sua sessao nao esta autorizada para criar projetos. Faca login novamente e tente de novo.');
        } else if (typeof creationError.payload === 'string' && creationError.payload.trim()) {
          setErro(creationError.payload);
        } else {
          setErro(creationError.message || 'Nao foi possivel criar o projeto agora. Tente novamente.');
        }
      } else {
        setErro('Nao foi possivel criar o projeto agora. Tente novamente.');
      }
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Card padding="none">
        <div className="border-b border-gray-700 px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate('/projetos')}
              className="mt-1 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Voltar para projetos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">Novo Projeto</h1>
              <p className="text-gray-400 text-xl">Passo {passoAtual} de 3</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                passoAtual >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              1
            </div>
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                passoAtual >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              2
            </div>
            <div
              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
                passoAtual >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
              }`}
            >
              3
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {erro && (
            <div className="rounded-md border border-red-700 bg-red-900/20 px-4 py-3 text-red-300">
              {erro}
            </div>
          )}

          {passoAtual === 1 && (
            <div className="space-y-6 page-enter">
              <h2 className="text-2xl font-bold text-gray-100">Cliente do Projeto</h2>

              <div className="rounded-lg border border-gray-700 p-4 space-y-4">
                <h3 className="text-lg font-semibold text-gray-100">Tipo de cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModoCliente('novo');
                      setClienteSelecionadoId(null);
                      setBuscaCliente('');
                      setErro(null);
                    }}
                    className={`rounded border px-4 py-4 text-left transition-colors ${
                      modoCliente === 'novo'
                        ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                        : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-base font-semibold">Novo cliente</p>
                    <p className="text-sm opacity-80">Cadastrar cliente e criar projeto em seguida.</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoCliente('existente');
                      setErro(null);
                    }}
                    className={`rounded border px-4 py-4 text-left transition-colors ${
                      modoCliente === 'existente'
                        ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                        : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                    }`}
                  >
                    <p className="text-base font-semibold">Cliente ja cadastrado</p>
                    <p className="text-sm opacity-80">Selecionar um cliente existente da base.</p>
                  </button>
                </div>
              </div>

              {modoCliente === 'novo' && (
                <div className="rounded-lg border border-gray-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">Dados do novo cliente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-300 mb-2">Nome Completo</label>
                      <input
                        value={clienteForm.nome}
                        onChange={(e) => setClienteForm((prev) => ({ ...prev, nome: e.target.value }))}
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Documento</label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={tipoDocumento}
                          onChange={(e) => {
                            const novoTipo = e.target.value as TipoDocumento;
                            setTipoDocumento(novoTipo);
                            setClienteForm((prev) => ({ ...prev, cpfCnpj: '' }));
                          }}
                          className="col-span-1 rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        >
                          <option value="cpf">CPF</option>
                          <option value="cnpj">CNPJ</option>
                        </select>
                        <input
                          value={clienteForm.cpfCnpj}
                          onChange={(e) =>
                            setClienteForm((prev) => ({
                              ...prev,
                              cpfCnpj: tipoDocumento === 'cpf' ? maskCpf(e.target.value) : maskCnpj(e.target.value)
                            }))
                          }
                          placeholder={tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                          inputMode="numeric"
                          className="col-span-2 rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Telefone</label>
                      <input
                        value={clienteForm.telefone}
                        onChange={(e) =>
                          setClienteForm((prev) => ({ ...prev, telefone: maskPhoneBR(e.target.value) }))
                        }
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-300 mb-2">E-mail</label>
                      <input
                        type="email"
                        value={clienteForm.email}
                        onChange={(e) => setClienteForm((prev) => ({ ...prev, email: e.target.value }))}
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      />
                    </div>


                    <div className="md:col-span-2 border-t border-gray-700 pt-4">
                      <h4 className="mb-3 text-base font-semibold text-gray-100">Endereco do cliente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">CEP</label>
                          <input
                            value={clienteForm.endereco.cep}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, cep: maskCep(e.target.value) }
                              }))
                            }
                            onBlur={() =>
                              void fillAddressFromCep(clienteForm.endereco.cep, (endereco) =>
                                setClienteForm((prev) => ({
                                  ...prev,
                                  endereco: {
                                    ...prev.endereco,
                                    cep: maskCep(endereco.cep),
                                    logradouro: endereco.logradouro || prev.endereco.logradouro,
                                    complemento: prev.endereco.complemento || endereco.complemento,
                                    bairro: endereco.bairro || prev.endereco.bairro,
                                    cidade: endereco.cidade || prev.endereco.cidade,
                                    estado: endereco.estado || prev.endereco.estado
                                  }
                                }))
                              )
                            }
                            inputMode="numeric"
                            placeholder="00000-000"
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Numero</label>
                          <input
                            value={clienteForm.endereco.numero}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, numero: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Logradouro</label>
                          <input
                            value={clienteForm.endereco.logradouro}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, logradouro: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Complemento</label>
                          <input
                            value={clienteForm.endereco.complemento}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, complemento: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Bairro</label>
                          <input
                            value={clienteForm.endereco.bairro}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, bairro: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Cidade</label>
                          <input
                            value={clienteForm.endereco.cidade}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, cidade: e.target.value }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">UF</label>
                          <input
                            maxLength={2}
                            value={clienteForm.endereco.estado}
                            onChange={(e) =>
                              setClienteForm((prev) => ({
                                ...prev,
                                endereco: { ...prev.endereco, estado: e.target.value.toUpperCase() }
                              }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modoCliente === 'existente' && (
                <div className="rounded-lg border border-gray-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">Selecionar cliente cadastrado</h3>

                  <div className="relative">
                    <input
                      value={buscaCliente}
                      onChange={(e) => setBuscaCliente(e.target.value)}
                      placeholder="Pesquisar por nome, CPF/CNPJ, telefone ou email"
                      className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-10 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    />
                    <MagnifyingGlass className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {clientesLoading && (
                    <p className="text-sm text-gray-300">Carregando clientes...</p>
                  )}

                  {!clientesLoading && (
                    <div className="max-h-64 overflow-auto space-y-2">
                      {clientesFiltrados.map((cliente) => (
                        <button
                          type="button"
                          key={cliente.id}
                          onClick={() => setClienteSelecionadoId(cliente.id)}
                          className={`w-full rounded border px-3 py-3 text-left transition-colors ${
                            clienteSelecionadoId === cliente.id
                              ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                              : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500'
                          }`}
                        >
                          <p className="font-semibold">{cliente.nome}</p>
                          <p className="text-sm text-gray-300">{formatDocumento(cliente.cpfCnpj)}</p>
                          <p className="text-sm text-gray-300">{formatTelefone(cliente.telefone)}</p>
                          <p className="text-sm text-gray-300">{cliente.email}</p>
                        </button>
                      ))}
                      {clientesFiltrados.length === 0 && (
                        <p className="text-sm text-gray-300">Nenhum cliente encontrado para o filtro informado.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    if (!validarPasso1()) {
                      setErro('Preencha os campos obrigatorios do cliente para avancar ao Passo 2.');
                      return;
                    }
                    setErro(null);
                    setPassoAtual(2);
                  }}
                >
                  Proximo Passo
                </Button>
              </div>
            </div>
          )}

          {passoAtual === 2 && (
            <div className="space-y-6 page-enter">
              <h2 className="text-2xl font-bold text-gray-100">Informacoes Basicas do Projeto</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Data de Abertura</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dadosBasicos.dataAbertura}
                      onChange={(e) =>
                        setDadosBasicos((prev) => ({ ...prev, dataAbertura: e.target.value }))
                      }
                      className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 pr-10 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    />
                    <Calendar className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Concessionaria</label>
                  <select
                    value={dadosBasicos.concessionaria}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, concessionaria: e.target.value }))
                    }
                    disabled={concessionariasLoading}
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="">
                      {concessionariasLoading ? 'Carregando...' : 'Selecione...'}
                    </option>
                    {concessionarias.map((item) => (
                      <option key={item.id} value={item.nome}>
                        {item.nome}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-gray-400">
                    <span>
                      {concessionarias.length > 0
                        ? `${concessionarias.length} concessionaria(s) disponivel(is) no cadastro local.`
                        : 'Nenhuma concessionaria ativa cadastrada.'}
                    </span>
                    <Link to="/concessionarias" className="text-cyan-300 hover:text-cyan-200">
                      Gerenciar concessionarias
                    </Link>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Numero da UC</label>
                  <input
                    value={dadosBasicos.numeroUc}
                    onChange={(e) =>
                      setDadosBasicos((prev) => ({ ...prev, numeroUc: maskNumeric(e.target.value, 20) }))
                    }
                    inputMode="numeric"
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">Tipo de Projeto</label>
                  <div className="grid grid-cols-2 gap-3">
                    {tiposProjeto.map((tipo) => (
                      <button
                        key={tipo.value}
                        type="button"
                        onClick={() =>
                          setDadosBasicos((prev) => ({
                            ...prev,
                            tipoProjeto: tipo.value
                          }))
                        }
                        className={`rounded border px-4 py-3 text-left transition-colors ${
                          dadosBasicos.tipoProjeto === tipo.value
                            ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                            : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                        }`}
                      >
                        <p className="font-semibold">{tipo.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 rounded-lg border border-gray-700 p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-100">Endereco do projeto</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setModoEnderecoProjeto('cliente')}
                      className={`rounded border px-4 py-4 text-left transition-colors ${
                        modoEnderecoProjeto === 'cliente'
                          ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                          : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-base font-semibold">Usar endereco do cliente</p>
                      <p className="text-sm opacity-80">Reaproveita o endereco cadastrado no cliente.</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoEnderecoProjeto('novo')}
                      className={`rounded border px-4 py-4 text-left transition-colors ${
                        modoEnderecoProjeto === 'novo'
                          ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                          : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'
                      }`}
                    >
                      <p className="text-base font-semibold">Cadastrar novo endereco</p>
                      <p className="text-sm opacity-80">Informar um endereco diferente para este projeto.</p>
                    </button>
                  </div>

                  {modoEnderecoProjeto === 'cliente' && (
                    <div className="space-y-3">
                      {!enderecoClienteDisponivel && (
                        <p className="rounded border border-yellow-700 bg-yellow-900/20 px-3 py-3 text-sm text-yellow-200">
                          O cliente selecionado nao possui endereco completo cadastrado. Escolha "Cadastrar novo endereco"
                          para continuar.
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-300 mb-2">CEP</label>
                          <input
                            value={enderecoClienteProjeto.cep}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Numero</label>
                          <input
                            value={enderecoClienteProjeto.numero}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Logradouro</label>
                          <input
                            value={enderecoClienteProjeto.logradouro}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Complemento</label>
                          <input
                            value={enderecoClienteProjeto.complemento}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Bairro</label>
                          <input
                            value={enderecoClienteProjeto.bairro}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-sm text-gray-300 mb-2">Cidade</label>
                          <input
                            value={enderecoClienteProjeto.cidade}
                            readOnly
                            className="w-full rounded border border-gray-600 bg-gray-900 text-gray-300 px-3 py-3 focus:outline-none"
                          />
                        </div>

                        

                        <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-12">
                          <div className="md:col-span-2">
                            <label className="block text-sm text-gray-300 mb-2">UF</label>
                            <input
                              value={enderecoClienteProjeto.estado}
                              readOnly
                              className="w-full rounded border border-gray-600 bg-gray-900 text-center text-gray-300 px-3 py-3 focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-5">
                            <label className="block text-sm text-gray-300 mb-2">Latitude</label>
                            <input
                              value={detalhesProjeto.coordenadas.latitude}
                              onChange={(e) =>
                                setDetalhesProjeto((prev) => ({
                                  ...prev,
                                  coordenadas: {
                                    ...prev.coordenadas,
                                    latitude: maskLatitude(e.target.value)
                                  }
                                }))
                              }
                              inputMode="decimal"
                              placeholder="-27.123456"
                              className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </div>

                          <div className="md:col-span-5">
                            <label className="block text-sm text-gray-300 mb-2">Longitude</label>
                            <input
                              value={detalhesProjeto.coordenadas.longitude}
                              onChange={(e) =>
                                setDetalhesProjeto((prev) => ({
                                  ...prev,
                                  coordenadas: {
                                    ...prev.coordenadas,
                                    longitude: maskLongitude(e.target.value)
                                  }
                                }))
                              }
                              inputMode="decimal"
                              placeholder="-54.321987"
                              className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                            />
                          </div>

                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">Link do Google Maps</label>
                          <input
                            value={detalhesProjeto.linkMapa}
                            onChange={(e) => setDetalhesProjeto((prev) => ({ ...prev, linkMapa: e.target.value }))}
                            placeholder="https://maps.google.com/..."
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {modoEnderecoProjeto === 'novo' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">CEP</label>
                        <input
                          value={enderecoProjeto.cep}
                          onChange={(e) =>
                            setEnderecoProjeto((prev) => ({ ...prev, cep: maskCep(e.target.value) }))
                          }
                          onBlur={() =>
                            void fillAddressFromCep(enderecoProjeto.cep, (endereco) =>
                              setEnderecoProjeto((prev) => ({
                                ...prev,
                                cep: maskCep(endereco.cep),
                                logradouro: endereco.logradouro || prev.logradouro,
                                complemento: prev.complemento || endereco.complemento,
                                bairro: endereco.bairro || prev.bairro,
                                cidade: endereco.cidade || prev.cidade,
                                estado: endereco.estado || prev.estado
                              }))
                            )
                          }
                          inputMode="numeric"
                          placeholder="00000-000"
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Numero</label>
                        <input
                          value={enderecoProjeto.numero}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, numero: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Logradouro</label>
                        <input
                          value={enderecoProjeto.logradouro}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, logradouro: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Complemento</label>
                        <input
                          value={enderecoProjeto.complemento}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, complemento: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Bairro</label>
                        <input
                          value={enderecoProjeto.bairro}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, bairro: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Cidade</label>
                        <input
                          value={enderecoProjeto.cidade}
                          onChange={(e) => setEnderecoProjeto((prev) => ({ ...prev, cidade: e.target.value }))}
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>

                      <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-12">
                        <div className="md:col-span-2">
                          <label className="block text-sm text-gray-300 mb-2">UF</label>
                          <input
                            maxLength={2}
                            value={enderecoProjeto.estado}
                            onChange={(e) =>
                              setEnderecoProjeto((prev) => ({ ...prev, estado: e.target.value.toUpperCase() }))
                            }
                            className="w-full rounded border border-gray-600 bg-gray-800 text-center text-gray-100 px-2 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-5">
                          <label className="block text-sm text-gray-300 mb-2">Latitude</label>
                          <input
                            value={detalhesProjeto.coordenadas.latitude}
                            onChange={(e) =>
                              setDetalhesProjeto((prev) => ({
                                ...prev,
                                coordenadas: {
                                  ...prev.coordenadas,
                                  latitude: maskLatitude(e.target.value)
                                }
                              }))
                            }
                            inputMode="decimal"
                            placeholder="-27.123456"
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>

                        <div className="md:col-span-5">
                          <label className="block text-sm text-gray-300 mb-2">Longitude</label>
                          <input
                            value={detalhesProjeto.coordenadas.longitude}
                            onChange={(e) =>
                              setDetalhesProjeto((prev) => ({
                                ...prev,
                                coordenadas: {
                                  ...prev.coordenadas,
                                  longitude: maskLongitude(e.target.value)
                                }
                              }))
                            }
                            inputMode="decimal"
                            placeholder="-54.321987"
                            className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Link do Google Maps</label>
                        <input
                          value={detalhesProjeto.linkMapa}
                          onChange={(e) => setDetalhesProjeto((prev) => ({ ...prev, linkMapa: e.target.value }))}
                          placeholder="https://maps.google.com/..."
                          className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setPassoAtual(1)}>
                  Voltar
                </Button>
                <Button
                  onClick={() => {
                    if (!validarPasso2()) {
                      setErro('Preencha os campos obrigatorios para avancar ao Passo 3.');
                      return;
                    }
                    setErro(null);
                    setPassoAtual(3);
                  }}
                >
                  Proximo Passo
                </Button>
              </div>
            </div>
          )}

          {passoAtual === 3 && (
            <div className="space-y-8">
              <h2 className="text-2xl font-bold text-gray-100">
                {dadosBasicos.tipoProjeto === 'fotovoltaico' ? 'Detalhes do Projeto Fotovoltaico' : 'Detalhes do Projeto'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-2">Integrador</label>
                  <select
                    value={dadosBasicos.integrador}
                    onChange={(e) => setDadosBasicos((prev) => ({ ...prev, integrador: e.target.value }))}
                    className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    {integradores.map((item, index) => (
                      <option key={item} value={index === 0 ? '' : item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Servicos</label>
                  <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-4 space-y-3">
                    {servicosDisponiveis.map((servico) => {
                      const checked = servicosSelecionados.includes(servico);

                      return (
                        <label
                          key={servico}
                          className="flex items-center gap-3 rounded border border-gray-700 px-3 py-3 text-gray-200"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setServicosSelecionados((prev) =>
                                e.target.checked ? [...prev, servico] : prev.filter((item) => item !== servico)
                              )
                            }
                            className="h-4 w-4 rounded border-gray-500 bg-gray-900 text-blue-500 focus:ring-blue-500"
                          />
                          <span>{servico}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {dadosBasicos.tipoProjeto === 'fotovoltaico' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Modalidade de Geracao</label>
                      <select
                        value={detalhesProjeto.modalidadeGeracao}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            modalidadeGeracao: e.target.value as DadosDetalhesForm['modalidadeGeracao']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="autoconsumo_local">AUTOCONSUMO LOCAL</option>
                        <option value="autoconsumo_remoto">AUTOCONSUMO REMOTO</option>
                        <option value="geracao_compartilhada">GERACAO COMPARTILHADA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Projeto Novo</label>
                      <select
                        value={detalhesProjeto.projetoNovo}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            projetoNovo: e.target.value as DadosDetalhesForm['projetoNovo']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="sim">SIM</option>
                        <option value="nao_ampliacao">NAO, AMPLIACAO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">
                        Projeto Zero-Grid ou com Controle de Exportacao
                      </label>
                      <select
                        value={detalhesProjeto.zeroGridControleExportacao}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            zeroGridControleExportacao:
                              e.target.value as DadosDetalhesForm['zeroGridControleExportacao']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="nao">NAO</option>
                        <option value="sim">SIM</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Projeto Fast Track</label>
                      <select
                        value={detalhesProjeto.projetoFastTrack}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            projetoFastTrack: e.target.value as DadosDetalhesForm['projetoFastTrack']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="nao">Nao</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-semibold text-gray-100">Modulos Fotovoltaicos</h3>
                      <Button variant="secondary" size="sm" onClick={() => setModulos((prev) => [...prev, buildItemVazio()])}>
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="border border-gray-700 rounded p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
                        <span>Qtd</span>
                        <span>Potencia (W)</span>
                        <span>Marca</span>
                        <span>Modelo</span>
                      </div>
                      {modulos.map((item) => (
                        <div key={item.id} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <input
                            value={item.quantidade}
                            onChange={(e) => handleModuloChange(item.id, 'quantidade', maskNumeric(e.target.value, 5))}
                            inputMode="numeric"
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                          <input
                            value={item.potencia}
                            onChange={(e) => handleModuloChange(item.id, 'potencia', maskNumeric(e.target.value, 6))}
                            inputMode="numeric"
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                          <input
                            value={item.marca}
                            onChange={(e) => handleModuloChange(item.id, 'marca', e.target.value)}
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                          <input
                            value={item.modelo}
                            onChange={(e) => handleModuloChange(item.id, 'modelo', e.target.value)}
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-3xl font-semibold text-gray-100">Inversores Fotovoltaicos</h3>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setInversores((prev) => [...prev, buildItemVazio()])}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <div className="border border-gray-700 rounded p-4 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-300">
                        <span>Qtd</span>
                        <span>Potencia (W)</span>
                        <span>Marca</span>
                        <span>Modelo</span>
                      </div>
                      {inversores.map((item) => (
                        <div key={item.id} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <input
                            value={item.quantidade}
                            onChange={(e) => handleInversorChange(item.id, 'quantidade', maskNumeric(e.target.value, 5))}
                            inputMode="numeric"
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                          <input
                            value={item.potencia}
                            onChange={(e) => handleInversorChange(item.id, 'potencia', maskNumeric(e.target.value, 6))}
                            inputMode="numeric"
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                          <input
                            value={item.marca}
                            onChange={(e) => handleInversorChange(item.id, 'marca', e.target.value)}
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                          <input
                            value={item.modelo}
                            onChange={(e) => handleInversorChange(item.id, 'modelo', e.target.value)}
                            className="rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded bg-blue-900/20 border border-blue-800/40 px-4 py-4">
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-300">Potencia total dos modulos</p>
                        <p className="text-blue-100 text-2xl mt-1">{potenciaTotalModulosW} W</p>
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-300">Potencia total dos inversores</p>
                        <p className="text-blue-100 text-2xl mt-1">{potenciaTotalInversoresW} W</p>
                      </div>
                      <div>
                        <p className="text-sm uppercase tracking-wide text-blue-300">Potencia total do sistema</p>
                        <p className="text-blue-100 text-2xl mt-1">{potenciaTotalSistemaW} W</p>
                        <p className="mt-1 text-xs text-blue-200/80">Resultado considera a menor potencia entre modulos e inversores.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {dadosBasicos.tipoProjeto === 'padrao_entrada' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Projeto Novo</label>
                      <select
                        value={detalhesProjeto.projetoNovo}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            projetoNovo: e.target.value as DadosDetalhesForm['projetoNovo']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="sim">SIM</option>
                        <option value="nao_ampliacao">NAO, AMPLIACAO</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Tensao de Fornecimento</label>
                      <select
                        value={detalhesProjeto.tensaoFornecimento}
                        onChange={(e) =>
                          setDetalhesProjeto((prev) => ({
                            ...prev,
                            tensaoFornecimento: e.target.value as DadosDetalhesForm['tensaoFornecimento']
                          }))
                        }
                        className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                      >
                        <option value="">Selecione...</option>
                        <option value="127/220V">127/220V</option>
                        <option value="380/220V">380/220V</option>
                      </select>
                    </div>

                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-100">Quadro de Padrao de Entrada</h3>
                      <p className="text-sm text-gray-400">Preencha quantidade e disjuntor nas linhas necessarias para o projeto EMUC.</p>
                    </div>

                    <div className="overflow-x-auto rounded border border-gray-700">
                      <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/60">
                          <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                            <th className="px-4 py-3">Tipo de Ligacao</th>
                            <th className="px-4 py-3">Classificacao</th>
                            <th className="px-4 py-3">Valor Unitario</th>
                            <th className="px-4 py-3">Quantidade</th>
                            <th className="px-4 py-3">Disjuntor</th>
                            <th className="px-4 py-3">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                          {padraoEntradaItens.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-gray-200">{item.tipoLigacao}</td>
                              <td className="px-4 py-3 text-sm text-gray-300">{item.classificacao}</td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {formatCurrencyBRL(tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0)}
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    handlePadraoEntradaChange(item.id, 'quantidade', maskNumeric(e.target.value, 4))
                                  }
                                  inputMode="numeric"
                                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  value={item.disjuntor}
                                  onChange={(e) => handlePadraoEntradaChange(item.id, 'disjuntor', e.target.value)}
                                  placeholder="Ex: 63A"
                                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                                />
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {formatCurrencyBRL(
                                  (Number(item.quantidade) || 0) *
                                    (tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0)
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label className="block text-sm text-gray-300">Custo do Projeto (R$)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setValorProjetoEditado(false);
                      setValorProjeto(String(custoCalculadoProjeto));
                    }}
                    className="text-xs font-medium text-blue-300 transition hover:text-blue-200"
                  >
                    Usar valor sugerido
                  </button>
                </div>
                <input
                  value={valorProjeto}
                  onChange={(e) => {
                    setValorProjetoEditado(true);
                    setValorProjeto(e.target.value.replace(/[^0-9.,]/g, ''));
                  }}
                  className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
                <p className="mt-2 text-sm text-gray-400">
                  {dadosBasicos.tipoProjeto === 'fotovoltaico'
                    ? `Valor sugerido pela faixa de potencia: ${formatCurrencyBRL(custoCalculadoProjeto)}.`
                    : `Valor sugerido pela tabela do EMUC: ${formatCurrencyBRL(custoCalculadoProjeto)}.`}
                </p>
                {valorProjetoEditado && (
                  <p className="mt-1 text-xs text-amber-300">
                    Valor manual ativo. Alteracoes de potencia nao substituem o valor ate voce reaplicar o sugerido.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Observacoes / Comentarios</label>
                <textarea
                  value={detalhesProjeto.observacoes}
                  onChange={(e) =>
                    setDetalhesProjeto((prev) => ({ ...prev, observacoes: e.target.value }))
                  }
                  rows={4}
                  className="w-full rounded border border-gray-600 bg-gray-800 text-gray-100 px-3 py-3 focus:outline-none focus:ring-2 focus:ring-opj-blue resize-y"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-3xl font-semibold text-gray-100">Documentos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documentosTemplate.map((item) => (
                    <label
                      key={item.key}
                      className="border border-dashed border-gray-500 rounded px-4 py-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-opj-blue transition-colors"
                    >
                      <UploadSimple className="h-6 w-6 text-gray-400" />
                      <span className="text-gray-200">{item.label}</span>
                      <span className="text-xs text-gray-400 truncate max-w-full">
                        {(documentos[item.key] ?? []).length > 0
                          ? `${(documentos[item.key] ?? []).length} arquivo(s) selecionado(s)`
                          : item.maxFiles
                            ? `Selecionar ate ${item.maxFiles} arquivos`
                            : 'Selecionar arquivo'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        multiple={Boolean(item.maxFiles && item.maxFiles > 1)}
                        onChange={(e) => handleDocumentosChange(item.key, e.target.files)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setPassoAtual(2)} disabled={salvando}>
                  Voltar
                </Button>
                <Button onClick={handleCriarProjeto} loading={salvando} disabled={!validarPasso3() && !salvando}>
                  Criar Projeto
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
