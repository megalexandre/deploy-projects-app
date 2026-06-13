import { StatusProjeto } from '@/core/entities/projeto';
import {
  maskCep,
  maskCpfOrCnpj,
  maskLatitude,
  maskLongitude,
  maskPhoneBR,
  onlyDigits,
  parseCoordinate,
} from '@/core/utils/masks';
import type {
  ClienteForm,
  DadosBasicosForm,
  DadosDetalhesForm,
  DocumentoCategoria,
  DocumentoSelecionado,
  EnderecoForm,
  ItemEquipamentoForm,
  ModoCliente,
  ModoEnderecoProjeto,
  PadraoEntradaItemForm,
  Passo,
  TipoDocumento,
} from '@/features/projects/domain/types';
import {
  ApiError,
  addressService,
  concessionairesService,
  customersService,
  filesService,
  projectsService,
  usersService,
  viaCepService,
  type Concessionaire,
  type CreateProjectData,
  type Customer,
  type User,
} from '@/services';
import type { Projeto } from '@/types';
import {
  buildTabelaPrecoPadraoEntradaMap,
  getCuponsDescontoProjetosAtivos,
  loadConfiguracoesSistema,
} from '@/utils/configuracoesSistema';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export interface IntegradorOption {
  id: string;
  name: string;
}

export const tiposProjeto = [
  { value: 'fotovoltaico' as const, label: 'Projeto fotovoltaico' },
  { value: 'padrao_entrada' as const, label: 'Padrão de entrada' },
];
export const servicosDisponiveis = [
  'Ligação Nova',
  'Aumento de Carga',
  'Troca de Titularidade',
  'Alteração no Compartilhamento de Creditos',
  'Projeto Eletrico',
];

export const documentosFotovoltaico: DocumentoCategoria[] = [
  { key: 'fatura_energia', label: 'Fatura de Energia' },
  { key: 'procuracao', label: 'Procuracao' },
  { key: 'documento_titular', label: 'Documento Titular' },
  { key: 'foto_padrao_entrada', label: 'Foto Padrão de Entrada' },
  { key: 'foto_disjuntor_geral', label: 'Foto Disjuntor Geral' },
  { key: 'foto_interconexao', label: 'Foto Interconexao' },
  { key: 'numero_poste_tr', label: 'Numero do Poste / TR' },
  { key: 'outros', label: 'Outros', maxFiles: 10 },
];

export const documentosEmucPessoaFisica: DocumentoCategoria[] = [
  { key: 'carta_prefeitura', label: 'Carta da prefeitura / habite-se' },
  { key: 'matricula_imovel', label: 'Matricula do Imovel' },
  { key: 'projeto_edificacao', label: 'Projeto da edificacao', maxFiles: 3 },
  { key: 'foto_padrao_instalado', label: 'Foto do padrão instalado', maxFiles: 3 },
  { key: 'foto_numero_poste', label: 'Foto do poste / transformador', maxFiles: 3 },
  { key: 'documento_cnh', label: 'CNH' },
  { key: 'documento_procuracao', label: 'Procuracao' },
  { key: 'conta_luz_terreno', label: 'Conta de luz do terreno' },
  { key: 'outros', label: 'Outros', maxFiles: 10 },
];

export const documentosEmucPessoaJuridica: DocumentoCategoria[] = [
  { key: 'carta_prefeitura', label: 'Carta da prefeitura / habite-se' },
  { key: 'matricula_imovel', label: 'Matricula do Imovel' },
  { key: 'projeto_edificacao', label: 'Projeto da edificacao', maxFiles: 3 },
  { key: 'foto_padrao_instalado', label: 'Foto do padrão instalado', maxFiles: 3 },
  { key: 'foto_numero_poste', label: 'Foto do poste / transformador', maxFiles: 3 },
  { key: 'contrato_social', label: 'Contrato Social' },
  { key: 'cartao_cnpj', label: 'Cartao CNPJ' },
  { key: 'documentacao_socios', label: 'Documentacao dos socios', maxFiles: 5 },
  { key: 'documento_procuracao', label: 'Procuracao' },
  { key: 'conta_luz_terreno', label: 'Conta de luz do terreno' },
  { key: 'outros', label: 'Outros', maxFiles: 10 },
];

export const padraoEntradaLinhasBase: Array<
  Pick<PadraoEntradaItemForm, 'tipoLigacao' | 'classificacao'>
> = [
  { tipoLigacao: 'Monofasico', classificacao: 'Residencial' },
  { tipoLigacao: 'Bifasico', classificacao: 'Residencial' },
  { tipoLigacao: 'Trifasico', classificacao: 'Residencial' },
  { tipoLigacao: 'Monofasico', classificacao: 'Comercial / Industrial' },
  { tipoLigacao: 'Bifasico', classificacao: 'Comercial / Industrial' },
  { tipoLigacao: 'Trifasico', classificacao: 'Comercial / Industrial' },
  { tipoLigacao: 'Monofasico', classificacao: 'Condominio' },
  { tipoLigacao: 'Bifasico', classificacao: 'Condominio' },
  { tipoLigacao: 'Trifasico', classificacao: 'Condominio' },
];

export const formatDocumento = (value: string) => maskCpfOrCnpj(value);
export const formatTelefone = (value: string) => maskPhoneBR(onlyDigits(value));

const isValidLatitude = (value: string) => {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -90 && parsed <= 90;
};

const isValidLongitude = (value: string) => {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -180 && parsed <= 180;
};

export const buildItemVazio = (): ItemEquipamentoForm => ({
  id: crypto.randomUUID(),
  quantidade: '',
  potencia: '',
  marca: '',
  modelo: '',
});

const buildPadraoEntradaLinhas = (
  tabelaConfigurada?: Array<Pick<PadraoEntradaItemForm, 'tipoLigacao' | 'classificacao'>>,
): PadraoEntradaItemForm[] => {
  const linhas =
    tabelaConfigurada?.filter((item) => item.tipoLigacao.trim() && item.classificacao.trim()) ?? [];
  const linhasBase = linhas.length > 0 ? linhas : padraoEntradaLinhasBase;

  return linhasBase.map((item) => ({
    id: crypto.randomUUID(),
    tipoLigacao: item.tipoLigacao,
    classificacao: item.classificacao,
    quantidade: '',
    disjuntor: '',
  }));
};

const buildEnderecoVazio = (): EnderecoForm => ({
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
});

const dataAtualIso = new Date().toISOString().split('T')[0];

const buildEnderecoCompleto = (endereco: EnderecoForm): string =>
  [
    `${endereco.logradouro.trim()}${endereco.numero.trim() ? `, ${endereco.numero.trim()}` : ''}`,
    endereco.complemento.trim(),
    endereco.bairro.trim(),
    `${endereco.cidade.trim()}${endereco.estado.trim() ? ` - ${endereco.estado.trim().toUpperCase()}` : ''}`,
    onlyDigits(endereco.cep).length === 8 ? `CEP ${maskCep(endereco.cep)}` : '',
  ]
    .filter(Boolean)
    .join(', ');

const getTipoDocumentoPorValor = (value?: string): TipoDocumento =>
  onlyDigits(value ?? '').length > 11 ? 'cnpj' : 'cpf';

const parseCurrencyInput = (value: string) => {
  const sanitized = value.replace(/[^\d,.-]/g, '');
  const normalized = sanitized.includes(',')
    ? sanitized.replace(/\./g, '').replace(',', '.')
    : sanitized;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrencyInput = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getFaixaFotovoltaicaValor = (
  potencias: { watts: number; kilowatts: number },
  faixas: Array<{ min: number; max: number; valor: number }>,
) => {
  if (
    !Number.isFinite(potencias.watts) ||
    !Number.isFinite(potencias.kilowatts) ||
    potencias.watts <= 0 ||
    faixas.length === 0
  ) {
    return 0;
  }

  const ordered = [...faixas].sort((a, b) => a.min - b.min);
  const highestMax = ordered.reduce((max, faixa) => Math.max(max, faixa.max), 0);
  const faixaUsaWatts = highestMax > 500;
  const potenciaComparacao = faixaUsaWatts ? potencias.watts : potencias.kilowatts;

  for (let index = 0; index < ordered.length; index += 1) {
    const faixa = ordered[index];
    const nextFaixa = ordered[index + 1];
    const estaDentroDaFaixa = potenciaComparacao >= faixa.min && potenciaComparacao <= faixa.max;
    const estaNoIntervaloAteProximaFaixa =
      potenciaComparacao >= faixa.min && (!nextFaixa || potenciaComparacao < nextFaixa.min);

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
        estado: endereco.estado ?? '',
      }
    : buildEnderecoVazio();

type UseNovoProjetoOptions = {
  projectId?: string;
  initialStep?: Passo;
};

const normalizeProjectType = (value?: string): DadosBasicosForm['tipoProjeto'] => {
  const normalized = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (normalized.includes('fotovolta') || normalized.includes('solar')) return 'fotovoltaico';
  if (normalized.includes('padrao') || normalized.includes('emuc')) return 'padrao_entrada';
  return '';
};

const normalizeGenerationModality = (value?: string): DadosDetalhesForm['modalidadeGeracao'] => {
  const normalized = (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (normalized.includes('remoto')) return 'autoconsumo_remoto';
  if (normalized.includes('compartilh')) return 'geracao_compartilhada';
  return 'autoconsumo_local';
};

export const useNovoProjeto = (options: UseNovoProjetoOptions = {}) => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const isEditing = Boolean(options.projectId);
  const [editingProject, setEditingProject] = useState<Projeto | null>(null);
  const [carregandoProjeto, setCarregandoProjeto] = useState(isEditing);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [passoAtual, setPassoAtual] = useState<Passo>(options.initialStep ?? 1);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [modoCliente, setModoCliente] = useState<ModoCliente | null>(null);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [concessionarias, setConcessionarias] = useState<Concessionaire[]>([]);
  const [concessionariasLoading, setConcessionariasLoading] = useState(false);
  const [integradores, setIntegradores] = useState<IntegradorOption[]>([]);
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
    integrador: '',
  });
  const [servicosSelecionados, setServicosSelecionados] = useState<string[]>([]);
  const [modoEnderecoProjeto, setModoEnderecoProjeto] = useState<ModoEnderecoProjeto>('cliente');
  const [enderecoProjeto, setEnderecoProjeto] = useState<EnderecoForm>(buildEnderecoVazio());

  const [clienteForm, setClienteForm] = useState<ClienteForm>({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    email: '',
    endereco: buildEnderecoVazio(),
  });

  const [detalhesProjeto, setDetalhesProjeto] = useState<DadosDetalhesForm>({
    modalidadeGeracao: 'autoconsumo_local',
    projetoFastTrack: 'nao',
    projetoNovo: 'sim',
    zeroGridControleExportacao: 'nao',
    linkMapa: '',
    coordenadas: { latitude: '', longitude: '' },
    tensaoFornecimento: '',
    observacoes: '',
  });

  const [modulos, setModulos] = useState<ItemEquipamentoForm[]>([buildItemVazio()]);
  const [inversores, setInversores] = useState<ItemEquipamentoForm[]>([buildItemVazio()]);
  const [configuracoesSistema] = useState(() => loadConfiguracoesSistema());
  const [padraoEntradaItens, setPadraoEntradaItens] = useState<PadraoEntradaItemForm[]>(() =>
    buildPadraoEntradaLinhas(configuracoesSistema.tabelaPrecoPadraoEntrada),
  );
  const [documentos, setDocumentos] = useState<Record<string, File[]>>({});
  const [selectedCustomerDocumentIds, setSelectedCustomerDocumentIds] = useState<string[]>([]);
  const [valorProjeto, setValorProjeto] = useState('');
  const [valorProjetoEditado, setValorProjetoEditado] = useState(false);
  const [usuariosIntegradores, setUsuariosIntegradores] = useState<User[]>([]);
  const [cupomProjetoId, setCupomProjetoId] = useState('');

  useEffect(() => {
    if (!options.projectId) return;
    const projectId = options.projectId;

    const loadProjectForEditing = async () => {
      setCarregandoProjeto(true);
      setErro(null);
      try {
        const [project, rawProject] = await Promise.all([
          projectsService.getById(projectId),
          projectsService.getByIdRaw(projectId),
        ]);
        const projectType = normalizeProjectType(project.tipoProjeto);
        const projectAddress = normalizeEnderecoForm(project.endereco);

        setEditingProject(project);
        setEditingAddressId(
          typeof rawProject.address_id === 'string' ? rawProject.address_id : null,
        );
        setModoCliente('existente');
        setClienteSelecionadoId(project.cliente.id);
        setModoEnderecoProjeto('novo');
        setEnderecoProjeto(projectAddress);
        setDadosBasicos({
          dataAbertura: project.dataAbertura?.slice(0, 10) || dataAtualIso,
          concessionaria: project.dadosProjeto.concessionaria || '',
          numeroUc: project.numeroUc || '',
          tipoProjeto: projectType,
          integrador: project.dadosProjeto.integrador || '',
        });
        setServicosSelecionados(project.servicos ?? []);
        setDetalhesProjeto({
          modalidadeGeracao: normalizeGenerationModality(project.dadosProjeto.modalidade),
          projetoFastTrack: project.projetoFastTrack === 'sim' ? 'sim' : 'nao',
          projetoNovo: project.projetoNovo === 'nao_ampliacao' ? 'nao_ampliacao' : 'sim',
          zeroGridControleExportacao: project.zeroGridControleExportacao === 'sim' ? 'sim' : 'nao',
          linkMapa: project.endereco.link ?? '',
          coordenadas: {
            latitude: project.coordenadas?.latitude ?? project.latitude ?? '',
            longitude: project.coordenadas?.longitude ?? project.longitude ?? '',
          },
          tensaoFornecimento:
            project.tensaoFornecimento === '127/220V' || project.tensaoFornecimento === '380/220V'
              ? project.tensaoFornecimento
              : '',
          observacoes: project.observacoes ?? '',
        });
        setModulos(
          project.modulos.length > 0
            ? project.modulos.map((item) => ({
                id: item.id,
                quantidade: String(item.quantidade),
                potencia: String(item.potencia),
                marca: item.fabricante,
                modelo: item.modelo,
              }))
            : [buildItemVazio()],
        );
        setInversores(
          project.inversores.length > 0
            ? project.inversores.map((item) => ({
                id: item.id,
                quantidade: String(item.quantidade),
                potencia: String(item.potencia),
                marca: item.fabricante,
                modelo: item.modelo,
              }))
            : [buildItemVazio()],
        );
        if (project.padraoEntradaItens?.length) {
          setPadraoEntradaItens(
            project.padraoEntradaItens.map((item) => ({
              ...item,
              quantidade: String(item.quantidade),
            })),
          );
        }
        setValorProjeto(formatCurrencyInput(project.valor));
        setValorProjetoEditado(true);
      } catch (loadError) {
        console.error('Erro ao carregar projeto para edicao:', loadError);
        setErro('Nao foi possivel carregar o projeto para edicao.');
      } finally {
        setCarregandoProjeto(false);
      }
    };

    void loadProjectForEditing();
  }, [options.projectId]);

  const tabelaPrecoPadraoEntradaMap = useMemo(
    () => buildTabelaPrecoPadraoEntradaMap(configuracoesSistema.tabelaPrecoPadraoEntrada),
    [configuracoesSistema.tabelaPrecoPadraoEntrada],
  );

  const potenciaTotalModulosW = useMemo(
    () =>
      modulos.reduce(
        (total, m) => total + (Number(m.quantidade) || 0) * (Number(m.potencia) || 0),
        0,
      ),
    [modulos],
  );

  const potenciaTotalInversoresW = useMemo(
    () =>
      inversores.reduce(
        (total, inv) => total + (Number(inv.quantidade) || 0) * (Number(inv.potencia) || 0),
        0,
      ),
    [inversores],
  );

  const potenciaTotalSistemaW = useMemo(() => {
    if (potenciaTotalModulosW > 0 && potenciaTotalInversoresW > 0) {
      return Math.min(potenciaTotalModulosW, potenciaTotalInversoresW);
    }
    return Math.max(potenciaTotalModulosW, potenciaTotalInversoresW);
  }, [potenciaTotalInversoresW, potenciaTotalModulosW]);

  const potenciaTotalSistemaKw = useMemo(
    () => Number((potenciaTotalSistemaW / 1000).toFixed(2)),
    [potenciaTotalSistemaW],
  );

  const precoFotovoltaicoAtual = useMemo(
    () =>
      getFaixaFotovoltaicaValor(
        {
          watts: potenciaTotalSistemaW,
          kilowatts: potenciaTotalSistemaKw,
        },
        configuracoesSistema.tabelaPrecoFotovoltaico,
      ),
    [configuracoesSistema.tabelaPrecoFotovoltaico, potenciaTotalSistemaKw, potenciaTotalSistemaW],
  );

  const custoCalculadoProjeto = useMemo(() => {
    if (dadosBasicos.tipoProjeto === 'fotovoltaico') {
      return precoFotovoltaicoAtual;
    }
    return padraoEntradaItens.reduce((total, item) => {
      const quantidade = Number(item.quantidade) || 0;
      const valorUnitario =
        tabelaPrecoPadraoEntradaMap[`${item.classificacao}|${item.tipoLigacao}`] ?? 0;
      return total + quantidade * valorUnitario;
    }, 0);
  }, [
    dadosBasicos.tipoProjeto,
    padraoEntradaItens,
    precoFotovoltaicoAtual,
    tabelaPrecoPadraoEntradaMap,
  ]);

  useEffect(() => {
    if (!valorProjetoEditado) {
      setValorProjeto(formatCurrencyInput(custoCalculadoProjeto));
    }
  }, [custoCalculadoProjeto, valorProjetoEditado]);

  const valorProjetoNumerico = useMemo(() => parseCurrencyInput(valorProjeto), [valorProjeto]);

  const usuarioIntegradorSelecionado = useMemo(
    () =>
      usuariosIntegradores.find(
        (usuario) => usuario.name.trim() === dadosBasicos.integrador.trim(),
      ) ?? null,
    [dadosBasicos.integrador, usuariosIntegradores],
  );

  const cuponsProjetoDisponiveis = useMemo(() => {
    const userId = usuarioIntegradorSelecionado?.id;
    if (!userId) return [];
    return getCuponsDescontoProjetosAtivos(configuracoesSistema).filter((cupom) => {
      const autorizados = cupom.usuariosAutorizados ?? [];
      return autorizados.includes(userId);
    });
  }, [configuracoesSistema, usuarioIntegradorSelecionado?.id]);

  useEffect(() => {
    if (cupomProjetoId && !cuponsProjetoDisponiveis.some((cupom) => cupom.id === cupomProjetoId)) {
      setCupomProjetoId('');
    }
  }, [cupomProjetoId, cuponsProjetoDisponiveis]);

  const cupomProjetoSelecionado = useMemo(
    () => cuponsProjetoDisponiveis.find((cupom) => cupom.id === cupomProjetoId) ?? null,
    [cupomProjetoId, cuponsProjetoDisponiveis],
  );

  const descontoProjetoPct = cupomProjetoSelecionado?.percentual ?? 0;
  const valorProjetoFinalNumerico = useMemo(
    () => Math.max(valorProjetoNumerico - valorProjetoNumerico * (descontoProjetoPct / 100), 0),
    [descontoProjetoPct, valorProjetoNumerico],
  );

  const tipoDocumentoCliente = useMemo(() => {
    if (modoCliente === 'novo') return tipoDocumento;
    const cliente = clientes.find((item) => item.id === clienteSelecionadoId);
    return getTipoDocumentoPorValor(cliente?.cpfCnpj);
  }, [clienteSelecionadoId, clientes, modoCliente, tipoDocumento]);

  const documentosTemplate = useMemo(() => {
    if (dadosBasicos.tipoProjeto === 'padrao_entrada') {
      return tipoDocumentoCliente === 'cnpj'
        ? documentosEmucPessoaJuridica
        : documentosEmucPessoaFisica;
    }
    return documentosFotovoltaico;
  }, [dadosBasicos.tipoProjeto, tipoDocumentoCliente]);

  useEffect(() => {
    setDocumentos((prev) =>
      documentosTemplate.reduce<Record<string, File[]>>((acc, item) => {
        acc[item.key] = prev[item.key] ?? [];
        return acc;
      }, {}),
    );
  }, [documentosTemplate]);

  useEffect(() => {
    setSelectedCustomerDocumentIds([]);
  }, [clienteSelecionadoId, modoCliente]);

  const clientesFiltrados = useMemo(() => {
    const query = buscaCliente.trim().toLowerCase();
    if (!query) return clientes;
    return clientes.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        onlyDigits(c.cpfCnpj).includes(onlyDigits(query)) ||
        c.email.toLowerCase().includes(query) ||
        onlyDigits(c.telefone).includes(onlyDigits(query)),
    );
  }, [buscaCliente, clientes]);

  const clienteSelecionado = useMemo(
    () => clientes.find((c) => c.id === clienteSelecionadoId) ?? null,
    [clienteSelecionadoId, clientes],
  );

  const reusedCustomerDocuments = useMemo(
    () =>
      (clienteSelecionadoDetalhe?.documentos ?? []).filter((d) =>
        selectedCustomerDocumentIds.includes(d.id),
      ),
    [clienteSelecionadoDetalhe?.documentos, selectedCustomerDocumentIds],
  );

  const enderecoClienteProjeto = useMemo(() => {
    if (modoCliente === 'novo') return clienteForm.endereco;
    return normalizeEnderecoForm(clienteSelecionadoDetalhe?.endereco);
  }, [clienteForm.endereco, clienteSelecionadoDetalhe?.endereco, modoCliente]);

  const enderecoProjetoAtual =
    modoEnderecoProjeto === 'cliente' ? enderecoClienteProjeto : enderecoProjeto;
  const enderecoClienteDisponivel = enderecoValido(enderecoClienteProjeto);

  useEffect(() => {
    const loadConcessionarias = async () => {
      setConcessionariasLoading(true);
      try {
        setConcessionarias(await concessionairesService.getAll());
      } catch (loadError) {
        console.error('Erro ao carregar concessionárias:', loadError);
        setErro('Nao foi possivel carregar as concessionárias disponiveis.');
      } finally {
        setConcessionariasLoading(false);
      }
    };
    void loadConcessionarias();
  }, []);

  useEffect(() => {
    const loadIntegradores = async () => {
      try {
        const users = await usersService.getAll();
        setUsuariosIntegradores(users);
        const options = users
          .map((user: User) => ({ id: user.id, name: user.name.trim() }))
          .filter((option) => option.id.length > 0 && option.name.length > 0)
          .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));

        if (options.length > 0) {
          setIntegradores(options);
          setDadosBasicos((prev) => {
            if (prev.integrador.trim() !== '') {
              return prev;
            }

            if (!currentUser?.isAdmin && options.length === 1) {
              return { ...prev, integrador: options[0].id };
            }

            return prev;
          });
        }
      } catch (loadError) {
        console.error('Erro ao carregar integradores:', loadError);
      }
    };

    void loadIntegradores();
  }, [currentUser?.isAdmin]);

  useEffect(() => {
    if (modoCliente !== 'existente') return;
    const loadClientes = async () => {
      setClientesLoading(true);
      try {
        setClientes(await customersService.getAll());
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
        setClienteSelecionadoDetalhe(await customersService.getById(clienteSelecionadoId));
      } catch (loadError) {
        console.error('Erro ao carregar detalhes do cliente selecionado:', loadError);
        setErro('Nao foi possivel carregar o endereco do cliente selecionado.');
      }
    };
    void loadClienteDetalhe();
  }, [clienteSelecionadoId, modoCliente]);

  const fillAddressFromCep = async (
    cep: string,
    updater: (address: {
      cep: string;
      logradouro: string;
      complemento: string;
      bairro: string;
      cidade: string;
      estado: string;
    }) => void,
  ) => {
    if (onlyDigits(cep).length !== 8) return;
    try {
      const endereco = await viaCepService.lookup(cep);
      if (endereco) updater(endereco);
    } catch (lookupError) {
      console.error('Erro ao consultar CEP:', lookupError);
    }
  };

  const handleModuloChange = (id: string, field: keyof ItemEquipamentoForm, value: string) => {
    setModulos((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleInversorChange = (id: string, field: keyof ItemEquipamentoForm, value: string) => {
    setInversores((prev) => prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)));
  };

  const handlePadraoEntradaChange = (
    id: string,
    field: 'quantidade' | 'disjuntor',
    value: string,
  ) => {
    setPadraoEntradaItens((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );
  };

  const handleDocumentosChange = (key: string, files: FileList | null) => {
    const categoria = documentosTemplate.find((item) => item.key === key);
    if (!categoria) return;
    const selecionados = Array.from(files ?? []);
    const limitados = categoria.maxFiles
      ? selecionados.slice(0, categoria.maxFiles)
      : selecionados.slice(0, 1);
    setDocumentos((prev) => ({ ...prev, [key]: limitados }));
  };

  const buildSelectedDocumentFiles = (): DocumentoSelecionado[] =>
    documentosTemplate.flatMap((categoria) =>
      (documentos[categoria.key] ?? []).map((file) => ({ categoria: categoria.label, file })),
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
          potenciaPico: Number(((quantidade * potencia) / 1000).toFixed(2)),
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
          potenciaTotal: Number(((quantidade * potencia) / 1000).toFixed(2)),
        };
      });

  const validarPasso1 = () => {
    if (!modoCliente) return false;
    if (modoCliente === 'existente') return Boolean(clienteSelecionadoId);
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
    const camposObrigatorios = [
      dadosBasicos.dataAbertura,
      dadosBasicos.concessionaria,
      dadosBasicos.numeroUc,
    ];
    return (
      camposObrigatorios.every((campo) => campo.trim() !== '') &&
      dadosBasicos.tipoProjeto !== '' &&
      enderecoValido(enderecoProjetoAtual)
    );
  };

  const validarPasso3 = () => {
    const coordenadasValidas =
      isValidLatitude(detalhesProjeto.coordenadas.latitude) &&
      isValidLongitude(detalhesProjeto.coordenadas.longitude);
    if (isEditing) {
      return dadosBasicos.integrador.trim() !== '';
    }
    if (!coordenadasValidas || dadosBasicos.integrador.trim() === '') return false;
    if (dadosBasicos.tipoProjeto === 'fotovoltaico') {
      return potenciaTotalModulosW > 0 && potenciaTotalInversoresW > 0 && potenciaTotalSistemaW > 0;
    }
    const temPadraoPreenchido = padraoEntradaItens.some(
      (item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== '',
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
          ? 'Preencha latitude entre -90 e 90, longitude entre -180 e 180, alem de modulos e inversores, para calcular corretamente a potência do sistema.'
          : 'Preencha tensao, latitude entre -90 e 90, longitude entre -180 e 180 e ao menos uma linha do quadro de padrão de entrada.',
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
          link: '',
        });

        const novoCliente = await customersService.create({
          nome: clienteForm.nome.trim(),
          addressId: enderecoCliente.id,
          cpfCnpj: onlyDigits(clienteForm.cpfCnpj),
          telefone: onlyDigits(clienteForm.telefone),
          email: clienteForm.email.trim(),
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
        const addressPayload = {
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
            (latitudeMapa && longitudeMapa
              ? `https://maps.google.com/?q=${encodeURIComponent(`${latitudeMapa},${longitudeMapa}`)}`
              : ''),
        };
        const enderecoProjetoSalvo =
          isEditing && editingAddressId
            ? await addressService.update({ id: editingAddressId, ...addressPayload })
            : await addressService.create(addressPayload);
        enderecoProjetoId = enderecoProjetoSalvo.id;
      }

      if (modoEnderecoProjeto === 'cliente' && !enderecoProjetoId) {
        setErro(
          'O cliente selecionado nao possui endereco vinculado. Cadastre um novo endereco para o projeto.',
        );
        setPassoAtual(2);
        return;
      }

      const documentoCliente =
        modoCliente === 'novo'
          ? onlyDigits(clienteForm.cpfCnpj)
          : onlyDigits(clienteSelecionado?.cpfCnpj ?? '');
      const classe = documentoCliente.length === 14 ? 'Comercial' : 'Residencial';
      const modalidade = projetoFotovoltaico
        ? detalhesProjeto.modalidadeGeracao === 'autoconsumo_local'
          ? 'AUTOCONSUMO LOCAL'
          : detalhesProjeto.modalidadeGeracao === 'autoconsumo_remoto'
            ? 'AUTOCONSUMO REMOTO'
            : 'GERACAO COMPARTILHADA'
        : 'Padrão de Entrada';
      const enquadramento = projetoFotovoltaico
        ? potenciaSistemaKw <= 75
          ? 'Microgeracao'
          : 'Minigeracao'
        : 'Padrão de Entrada';
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
        id: editingProject?.id ?? crypto.randomUUID(),
        clientId: clienteId,
        addressId: enderecoProjetoId ?? undefined,
        nomeCliente:
          modoCliente === 'novo' ? clienteForm.nome.trim() : (clienteSelecionado?.nome ?? ''),
        utilityCompany: dadosBasicos.concessionaria,
        utilityProtocol: editingProject?.protocolo ?? gerarProtocolo(),
        customerClass: classe,
        integrator: dadosBasicos.integrador,
        modality: modalidade,
        framework: enquadramento,
        dcProtection: projetoFotovoltaico ? 'Disjuntor CC 20A' : undefined,
        systemPower: projetoFotovoltaico
          ? potenciaSistemaKw || editingProject?.dadosProjeto.potenciaSistema || 0
          : 0,
        status: isEditing ? undefined : StatusProjeto.EM_ANALISE_DOCUMENTACAO,
        amount: valorProjetoFinalNumerico,
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
                disjuntor: item.disjuntor.trim(),
              })),
        modulos: projetoFotovoltaico ? buildModulosPayload() : [],
        inversores: projetoFotovoltaico ? buildInversoresPayload() : [],
        documentos: [],
        enderecoCompleto: buildEnderecoCompleto(enderecoProjetoAtual),
        dataAbertura: dadosBasicos.dataAbertura,
        coordinates: { latitude: latitudeFormatada, longitude: longitudeFormatada },
        fastTrack: projetoFotovoltaico ? detalhesProjeto.projetoFastTrack : 'nao',
        projetoNovo: detalhesProjeto.projetoNovo,
        zeroGridControleExportacao: projetoFotovoltaico
          ? detalhesProjeto.zeroGridControleExportacao
          : 'nao',
        description: detalhesProjeto.observacoes.trim(),
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
        potenciaSistemaKw,
      });
      console.log('Enviando dados para API:', projectData);

      const projetoSalvo =
        isEditing && editingProject
          ? await projectsService.update(editingProject.id, projectData)
          : await projectsService.create(projectData);
      const projetoOrcamentoConexao =
        !isEditing && dadosBasicos.tipoProjeto === 'padrao_entrada'
          ? await projectsService.create({
              ...projectData,
              id: crypto.randomUUID(),
              utilityProtocol: gerarProtocolo(),
              projectType: 'orcamento_conexao',
              servicesNames: ['Orçamento de Conexão'],
              amount: 0,
              padraoEntradaItens: [],
              tensaoFornecimento: undefined,
              description: [
                'Projeto gerado automaticamente a partir do Projeto EMUC.',
                detalhesProjeto.observacoes.trim(),
              ]
                .filter(Boolean)
                .join('\n\n'),
            })
          : null;
      const documentosSelecionados = buildSelectedDocumentFiles();

      if (documentosSelecionados.length > 0) {
        // O upload depende do id do projeto ja existir, por isso acontece depois da criacao.
        const uploadedFiles = await filesService.uploadFiles(
          projetoSalvo.id,
          documentosSelecionados.map((item) => item.file),
        );
        projectsService.saveDocuments(projetoSalvo.id, [
          ...reusedCustomerDocuments,
          ...uploadedFiles.map((uploadedFile, index) => ({
            id: uploadedFile.id,
            fileId: uploadedFile.id,
            nome: uploadedFile.fileName,
            tipo: documentosSelecionados[index]?.categoria ?? 'Documento',
            dataUpload: uploadedFile.createdAt ?? new Date().toISOString(),
            tamanho: uploadedFile.size,
            url: uploadedFile.urlS3,
          })),
        ]);
        if (projetoOrcamentoConexao) {
          const uploadedOrcamentoFiles = await filesService.uploadFiles(
            projetoOrcamentoConexao.id,
            documentosSelecionados.map((item) => item.file),
          );
          projectsService.saveDocuments(projetoOrcamentoConexao.id, [
            ...reusedCustomerDocuments,
            ...uploadedOrcamentoFiles.map((uploadedFile, index) => ({
              id: uploadedFile.id,
              fileId: uploadedFile.id,
              nome: uploadedFile.fileName,
              tipo: documentosSelecionados[index]?.categoria ?? 'Documento',
              dataUpload: uploadedFile.createdAt ?? new Date().toISOString(),
              tamanho: uploadedFile.size,
              url: uploadedFile.urlS3,
            })),
          ]);
        }
      } else if (reusedCustomerDocuments.length > 0) {
        projectsService.saveDocuments(projetoSalvo.id, reusedCustomerDocuments);
        if (projetoOrcamentoConexao) {
          projectsService.saveDocuments(projetoOrcamentoConexao.id, reusedCustomerDocuments);
        }
      }

      navigate(isEditing ? `/projetos/${projetoSalvo.id}` : '/projetos');
    } catch (creationError) {
      console.error(`Erro ao ${isEditing ? 'editar' : 'criar'} projeto:`, creationError);
      if (creationError instanceof ApiError) {
        console.error('Detalhes do erro:', creationError.payload);
        if (creationError.status === 401 || creationError.status === 403) {
          setErro(
            `Sua sessao nao esta autorizada para ${isEditing ? 'editar' : 'criar'} projetos. Faca login novamente e tente de novo.`,
          );
        } else if (typeof creationError.payload === 'string' && creationError.payload.trim()) {
          setErro(creationError.payload);
        } else {
          setErro(
            creationError.message ||
              `Nao foi possivel ${isEditing ? 'editar' : 'criar'} o projeto agora. Tente novamente.`,
          );
        }
      } else {
        setErro(
          `Nao foi possivel ${isEditing ? 'editar' : 'criar'} o projeto agora. Tente novamente.`,
        );
      }
    } finally {
      setSalvando(false);
    }
  };

  return {
    navigate,
    currentUser,
    isEditing,
    editingProject,
    carregandoProjeto,
    integradores,
    enderecoClienteProjeto,
    tabelaPrecoPadraoEntradaMap,
    valorProjetoEditado,
    validarPasso1,
    validarPasso2,
    validarPasso3,
    passoAtual,
    setPassoAtual,
    tipoDocumento,
    setTipoDocumento,
    modoCliente,
    setModoCliente,
    clientes,
    clientesLoading,
    concessionarias,
    concessionariasLoading,
    clienteSelecionadoId,
    setClienteSelecionadoId,
    clienteSelecionadoDetalhe,
    buscaCliente,
    setBuscaCliente,
    salvando,
    erro,
    setErro,
    dadosBasicos,
    setDadosBasicos,
    servicosSelecionados,
    setServicosSelecionados,
    modoEnderecoProjeto,
    setModoEnderecoProjeto,
    enderecoProjeto,
    setEnderecoProjeto,
    clienteForm,
    setClienteForm,
    detalhesProjeto,
    setDetalhesProjeto,
    modulos,
    setModulos,
    inversores,
    setInversores,
    padraoEntradaItens,
    documentos,
    selectedCustomerDocumentIds,
    setSelectedCustomerDocumentIds,
    valorProjeto,
    setValorProjeto,
    setValorProjetoEditado,
    cupomProjetoId,
    setCupomProjetoId,
    cuponsProjetoDisponiveis,
    descontoProjetoPct,
    valorProjetoFinalNumerico,
    potenciaTotalModulosW,
    potenciaTotalInversoresW,
    potenciaTotalSistemaW,
    potenciaTotalSistemaKw,
    custoCalculadoProjeto,
    valorProjetoNumerico,
    tipoDocumentoCliente,
    documentosTemplate,
    clientesFiltrados,
    clienteSelecionado,
    reusedCustomerDocuments,
    enderecoProjetoAtual,
    enderecoClienteDisponivel,
    fillAddressFromCep,
    handleModuloChange,
    handleInversorChange,
    handlePadraoEntradaChange,
    handleDocumentosChange,
    handleCriarProjeto,
  };
};
