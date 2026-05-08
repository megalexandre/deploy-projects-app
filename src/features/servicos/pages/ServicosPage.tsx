/** Pagina 'ServicosPage': implementa cadastro e acompanhamento dos servicos descritos no documento funcional. */
import React, { useEffect, useMemo, useState } from 'react';
import { FloppyDisk, MagnifyingGlass, PencilSimple, PlusCircle, X } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { concessionariasService, customersService, filesService, servicosService, viaCepService, type Concessionaria, type Customer } from '@/services';
import type { DivisaoCreditos, Documento, Endereco, PadraoEntradaItem, Servico, StatusServico, TipoServico } from '@/types';
import { getCuponsDescontoAtivos, loadConfiguracoesSistema } from '@/utils/configuracoesSistema';
import { formatCurrencyBRL, maskCep, maskLatitude, maskLongitude, maskNumeric, onlyDigits, parseCoordinate } from '@/core/utils/masks';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

type PersonType = 'cpf' | 'cnpj';

interface AddressForm {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface PadraoEntradaItemForm {
  id: string;
  tipoLigacao: string;
  classificacao: string;
  quantidade: string;
  disjuntor: string;
}

interface RateioForm {
  id: string;
  uc: string;
  endereco: string;
  classe: string;
  percentual: string;
}

interface ServicoForm {
  tipo: TipoServico;
  clienteId: string;
  clienteNomeManual: string;
  concessionaria: string;
  dataAbertura: string;
  valor: string;
  cupomDescontoPct: string;
  observacoes: string;
  enderecoObra: AddressForm;
  tensaoFornecimento: '' | '127/220V' | '380/220V';
  latitude: string;
  longitude: string;
  padraoMaisDe30m: 'nao' | 'sim';
  pontoReferencia: string;
  padraoEntradaItens: PadraoEntradaItemForm[];
  ucGeradora: string;
  enderecoGeradora: AddressForm;
  rateios: RateioForm[];
}

interface DocumentoCategoria {
  key: string;
  label: string;
  maxFiles?: number;
}

interface DocumentoSelecionado {
  categoria: string;
  file: File;
}

const tipoServicoOptions: Array<{ value: TipoServico; label: string; description: string }> = [
  { value: 'ligacao_nova', label: 'Ligacao Nova', description: 'Endereco da obra, tensao, coordenadas, padrao e uploads.' },
  { value: 'aumento_carga', label: 'Aumento de Carga', description: 'Mesmo fluxo tecnico de ligacao nova, com anexos da unidade atual.' },
  { value: 'troca_titularidade', label: 'Troca de Titularidade', description: 'Usa o mesmo fluxo tecnico e os mesmos campos de aumento de carga.' },
  { value: 'alteracao_compartilhamento_credito', label: 'Alteracao Compartilhamento de Credito', description: 'UC geradora, endereco e rateio das beneficiarias.' }
];

const tipoLigacaoOptions = ['Monofasico', 'Bifasico', 'Trifasico'];
const classificacaoOptions = ['Residencial', 'Comercial', 'Industrial', 'Rural', 'Condominio'];

const statusColumnStyles: Record<StatusServico, string> = {
  aguardando_aprovacao: 'border-amber-500/60 bg-amber-700/20',
  abertura_servico: 'border-amber-700/60 bg-amber-900/20',
  elaboracao_documentacao: 'border-orange-700/60 bg-orange-900/20',
  aguardando_assinatura_cliente: 'border-yellow-700/60 bg-yellow-900/20',
  aguardando_protocolo_concessionaria: 'border-lime-700/60 bg-lime-900/20',
  em_analise_concessionaria: 'border-sky-700/60 bg-sky-900/20',
  ressalvas: 'border-rose-700/60 bg-rose-900/20',
  obras_concessionaria: 'border-cyan-700/60 bg-cyan-900/20',
  servico_aprovado: 'border-emerald-700/60 bg-emerald-900/20',
  vistoria_solicitada: 'border-teal-700/60 bg-teal-900/20',
  vistoria_reprovada: 'border-red-700/60 bg-red-900/20',
  servico_encerrado: 'border-emerald-700/60 bg-emerald-900/30'
};

const emptyAddress = (): AddressForm => ({
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: ''
});

const buildPadraoItem = (): PadraoEntradaItemForm => ({
  id: crypto.randomUUID(),
  tipoLigacao: 'Monofasico',
  classificacao: 'Residencial',
  quantidade: '',
  disjuntor: ''
});

const buildRateio = (): RateioForm => ({
  id: crypto.randomUUID(),
  uc: '',
  endereco: '',
  classe: 'Residencial',
  percentual: ''
});

const createEmptyForm = (): ServicoForm => ({
  tipo: 'ligacao_nova',
  clienteId: '',
  clienteNomeManual: '',
  concessionaria: '',
  dataAbertura: new Date().toISOString().slice(0, 10),
  valor: '',
  cupomDescontoPct: '0',
  observacoes: '',
  enderecoObra: emptyAddress(),
  tensaoFornecimento: '',
  latitude: '',
  longitude: '',
  padraoMaisDe30m: 'nao',
  pontoReferencia: '',
  padraoEntradaItens: [buildPadraoItem()],
  ucGeradora: '',
  enderecoGeradora: emptyAddress(),
  rateios: [buildRateio()]
});

const personDocuments: Record<PersonType, DocumentoCategoria[]> = {
  cpf: [
    { key: 'cnh', label: 'CNH' },
    { key: 'procuracao_pf', label: 'Procuracao' }
  ],
  cnpj: [
    { key: 'contrato_social', label: 'Contrato Social' },
    { key: 'cartao_cnpj', label: 'Cartao CNPJ' },
    { key: 'documentacao_socios', label: 'Documentacao do(s) Socio(s)' },
    { key: 'procuracao_pj', label: 'Procuracao' }
  ]
};

const documentCategoriesByType: Record<TipoServico, DocumentoCategoria[]> = {
  ligacao_nova: [
    { key: 'matricula_imovel', label: 'Matricula do Imovel' },
    { key: 'foto_padrao_instalado', label: 'Foto do padrao instalado', maxFiles: 3 },
    { key: 'outros', label: 'Outros', maxFiles: 5 }
  ],
  aumento_carga: [
    { key: 'conta_energia_atual', label: 'Conta de Energia atual' },
    { key: 'foto_padrao_entrada_atual', label: 'Foto do Padrao de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 }
  ],
  troca_titularidade: [
    { key: 'conta_energia', label: 'Conta de Energia' },
    { key: 'foto_padrao_atual', label: 'Foto do Padrao de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 }
  ],
  alteracao_compartilhamento_credito: [
    { key: 'conta_geradora', label: 'Conta de Energia da Geradora' },
    { key: 'contas_beneficiarias', label: 'Conta de Energia da(s) Beneficiarias', maxFiles: 5 },
    { key: 'foto_padrao_atual', label: 'Foto do Padrao de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 }
  ]
};

const normalizeAddressFromCustomer = (customer?: Customer | null): AddressForm =>
  customer?.endereco
    ? {
        cep: customer.endereco.cep ?? '',
        logradouro: customer.endereco.logradouro ?? '',
        numero: customer.endereco.numero ?? '',
        complemento: customer.endereco.complemento ?? '',
        bairro: customer.endereco.bairro ?? '',
        cidade: customer.endereco.cidade ?? '',
        estado: customer.endereco.estado ?? ''
      }
    : emptyAddress();

const isAddressValid = (address: AddressForm) =>
  address.logradouro.trim().length >= 3 &&
  address.numero.trim().length >= 1 &&
  address.bairro.trim().length >= 2 &&
  address.cidade.trim().length >= 2 &&
  address.estado.trim().length === 2 &&
  address.cep.replace(/\D/g, '').length === 8;

const toEnderecoPayload = (address: AddressForm): Endereco => ({
  cep: address.cep,
  logradouro: address.logradouro.trim(),
  numero: address.numero.trim(),
  complemento: address.complemento.trim(),
  bairro: address.bairro.trim(),
  cidade: address.cidade.trim(),
  estado: address.estado.trim().toUpperCase()
});

const isTechnicalType = (tipo: TipoServico) =>
  tipo === 'ligacao_nova' || tipo === 'aumento_carga' || tipo === 'troca_titularidade';
const canUseRateioType = (tipo: TipoServico) => tipo === 'alteracao_compartilhamento_credito';
const getPersonType = (customer?: Customer | null): PersonType => ((customer?.cpfCnpj.replace(/\D/g, '').length ?? 0) > 11 ? 'cnpj' : 'cpf');
const buildDocumentCategories = (tipo: TipoServico, personType: PersonType): DocumentoCategoria[] => [
  ...documentCategoriesByType[tipo].filter((item) => item.key !== 'outros'),
  ...personDocuments[personType],
  ...documentCategoriesByType[tipo].filter((item) => item.key === 'outros')
];
const currencyTextToNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};
const buildSelectedDocumentFiles = (filesByCategory: Record<string, File[]>, categories: DocumentoCategoria[]): DocumentoSelecionado[] =>
  categories.flatMap((category) =>
    (filesByCategory[category.key] ?? []).map((file) => ({
      categoria: category.label,
      file
    }))
  );
const getTipoLabel = (tipo: TipoServico) => tipoServicoOptions.find((item) => item.value === tipo)?.label ?? tipo;
const formatAddressSummary = (endereco?: Endereco) => {
  if (!endereco) {
    return '-';
  }

  return [
    `${endereco.logradouro}${endereco.numero ? `, ${endereco.numero}` : ''}`,
    endereco.bairro,
    `${endereco.cidade}${endereco.estado ? `/${endereco.estado}` : ''}`
  ]
    .filter(Boolean)
    .join(' - ') || '-';
};

export const ServicosPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const canManageStatus = currentUser?.isAdmin === true;
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [concessionarias, setConcessionarias] = useState<Concessionaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusServico>('todos');
  const [typeFilter, setTypeFilter] = useState<'todos' | TipoServico>('todos');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServicoForm>(createEmptyForm());
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [cupons] = useState(() => getCuponsDescontoAtivos(loadConfiguracoesSistema()));

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servicosData, clientesData, concessionariasData] = await Promise.all([
          servicosService.list(),
          customersService.getAll().catch(() => []),
          concessionariasService.getActive().catch(() => [])
        ]);

        setServicos(servicosData);
        setClientes(clientesData);
        setConcessionarias(concessionariasData);
      } catch (loadError) {
        console.error('Erro ao carregar servicos:', loadError);
        setError('Nao foi possivel carregar os servicos.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const selectedCustomer = useMemo(
    () => clientes.find((item) => item.id === form.clienteId) ?? null,
    [clientes, form.clienteId]
  );

  const personType = useMemo(() => getPersonType(selectedCustomer), [selectedCustomer]);
  const documentCategories = useMemo(() => buildDocumentCategories(form.tipo, personType), [form.tipo, personType]);
  const valorNumerico = useMemo(() => currencyTextToNumber(form.valor), [form.valor]);
  const descontoPct = Number(form.cupomDescontoPct);
  const valorFinal = useMemo(() => Math.max(valorNumerico - valorNumerico * (descontoPct / 100), 0), [descontoPct, valorNumerico]);

  useEffect(() => {
    setUploadedFiles((current) =>
      documentCategories.reduce<Record<string, File[]>>((acc, item) => {
        acc[item.key] = current[item.key] ?? [];
        return acc;
      }, {})
    );
  }, [documentCategories]);

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

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setUploadedFiles({});
    setError(null);
  };

  const filteredServicos = useMemo(
    () =>
      servicos.filter((servico) => {
        const query = searchTerm.toLowerCase();
        const matchesStatus = statusFilter === 'todos' || servico.status === statusFilter;
        const matchesType = typeFilter === 'todos' || servico.tipo === typeFilter;
        const nome = String(servico.nome ?? '').toLowerCase();
        const cliente = String(servico.cliente ?? '').toLowerCase();
        const protocolo = String(servico.protocolo ?? '').toLowerCase();
        const concessionaria = String(servico.concessionaria ?? '').toLowerCase();

        if (!matchesStatus || !matchesType) {
          return false;
        }

        return (
          nome.includes(query) ||
          cliente.includes(query) ||
          protocolo.includes(query) ||
          concessionaria.includes(query)
        );
      }),
    [searchTerm, servicos, statusFilter, typeFilter]
  );

  const groupedServicos = useMemo(
    () =>
      servicosService.statusFlow.reduce<Record<StatusServico, Servico[]>>((acc, column) => {
        acc[column.status] = filteredServicos.filter((item) => item.status === column.status);
        return acc;
      }, {} as Record<StatusServico, Servico[]>),
    [filteredServicos]
  );

  const stats = useMemo(() => {
    const total = filteredServicos.length;
    const valor = filteredServicos.reduce((acc, item) => acc + item.valorFinal, 0);
    const abertas = filteredServicos.filter((item) => item.status !== 'servico_encerrado').length;
    const aprovadas = filteredServicos.filter((item) => item.status === 'servico_aprovado' || item.status === 'servico_encerrado').length;
    return { total, valor, abertas, aprovadas };
  }, [filteredServicos]);

  const validateForm = () => {
    const clienteValido = form.clienteId !== '' || form.clienteNomeManual.trim().length >= 2;
    const valorValido = valorNumerico > 0;
    const coordenadasValidas =
      !isTechnicalType(form.tipo) ||
      (parseCoordinate(form.latitude) !== null && parseCoordinate(form.longitude) !== null);
    const enderecoObraValido = !isTechnicalType(form.tipo) || isAddressValid(form.enderecoObra);
    const enderecoGeradoraValido = !canUseRateioType(form.tipo) || isAddressValid(form.enderecoGeradora);
    const ucGeradoraValida = !canUseRateioType(form.tipo) || form.ucGeradora.trim().length >= 3;
    const tensaoValida = !isTechnicalType(form.tipo) || form.tensaoFornecimento !== '';
    const padraoValido =
      !isTechnicalType(form.tipo) ||
      form.padraoEntradaItens.some((item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== '');
    const rateioValido =
      !canUseRateioType(form.tipo) ||
      form.rateios.some((item) => item.uc.trim() && item.endereco.trim() && Number(item.percentual) > 0);

    return (
      clienteValido &&
      form.concessionaria.trim() !== '' &&
      form.dataAbertura.trim() !== '' &&
      valorValido &&
      coordenadasValidas &&
      enderecoObraValido &&
      enderecoGeradoraValido &&
      ucGeradoraValida &&
      tensaoValida &&
      padraoValido &&
      rateioValido
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      setError('Preencha os campos obrigatorios do servico antes de salvar.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const documentosExistentes = editingId
        ? servicos.find((item) => item.id === editingId)?.documentos ?? []
        : [];
      const payload = {
        tipo: form.tipo,
        clienteId: form.clienteId || undefined,
        cliente: form.clienteId ? (selectedCustomer?.nome ?? '') : form.clienteNomeManual.trim(),
        concessionaria: form.concessionaria,
        dataAbertura: form.dataAbertura,
        valor: valorNumerico,
        cupomDescontoPct: descontoPct,
        observacoes: form.observacoes.trim(),
        tensaoFornecimento: isTechnicalType(form.tipo) ? form.tensaoFornecimento || undefined : undefined,
        coordenadas:
          isTechnicalType(form.tipo)
            ? {
                latitude: maskLatitude(form.latitude),
                longitude: maskLongitude(form.longitude)
              }
            : undefined,
        pontoReferencia: isTechnicalType(form.tipo) ? form.pontoReferencia.trim() : undefined,
        padraoMaisDe30m: isTechnicalType(form.tipo) ? form.padraoMaisDe30m : undefined,
        enderecoObra: isTechnicalType(form.tipo) ? toEnderecoPayload(form.enderecoObra) : undefined,
        ucGeradora: canUseRateioType(form.tipo) ? form.ucGeradora.trim() : undefined,
        enderecoGeradora: canUseRateioType(form.tipo) ? toEnderecoPayload(form.enderecoGeradora) : undefined,
        padraoEntradaItens: isTechnicalType(form.tipo)
          ? form.padraoEntradaItens
              .filter((item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== '')
              .map<PadraoEntradaItem>((item) => ({
                id: item.id,
                tipoLigacao: item.tipoLigacao,
                classificacao: item.classificacao,
                quantidade: Number(item.quantidade) || 0,
                disjuntor: item.disjuntor.trim()
              }))
          : [],
        rateios: canUseRateioType(form.tipo)
          ? form.rateios
              .filter((item) => item.uc.trim() && item.endereco.trim() && Number(item.percentual) > 0)
              .map<DivisaoCreditos>((item) => ({
                uc: item.uc.trim(),
                endereco: item.endereco.trim(),
                classe: item.classe,
                percentual: Number(item.percentual) || 0
              }))
          : [],
        documentos: documentosExistentes
      };

      let service = editingId
        ? await servicosService.update(editingId, payload)
        : await servicosService.create(payload);

      const documentosSelecionados = buildSelectedDocumentFiles(uploadedFiles, documentCategories);

      if (documentosSelecionados.length > 0) {
        // O fluxo legado de servicos reaproveita a mesma regra de upload da tela dedicada
        // para evitar divergencia de comportamento entre as duas entradas de cadastro.
        const uploadedDocuments = await filesService.uploadFiles(
          service.id,
          documentosSelecionados.map((item) => item.file)
        );

        service = await servicosService.saveDocuments(
          service.id,
          [
            ...documentosExistentes,
            ...uploadedDocuments.map((uploadedDocument, index): Documento => ({
              id: uploadedDocument.id,
              fileId: uploadedDocument.id,
              nome: uploadedDocument.fileName,
              tipo: documentosSelecionados[index]?.categoria ?? 'Documento',
              dataUpload: uploadedDocument.createdAt ?? new Date().toISOString(),
              tamanho: uploadedDocument.size,
              url: uploadedDocument.urlS3
            }))
          ]
        );
      }

      setServicos((current) => {
        const exists = current.some((item) => item.id === service.id);
        return exists ? current.map((item) => (item.id === service.id ? service : item)) : [service, ...current];
      });

      resetForm();
      setFormOpen(false);
    } catch (saveError) {
      console.error('Erro ao salvar servico:', saveError);
      setError('Nao foi possivel salvar o servico.');
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (serviceId: string, nextStatus: StatusServico) => {
    const previous = servicos;
    setServicos((current) => current.map((item) => (item.id === serviceId ? { ...item, status: nextStatus } : item)));

    try {
      const updated = await servicosService.updateStatus(serviceId, nextStatus);
      setServicos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (updateError) {
      console.error('Erro ao atualizar status do servico:', updateError);
      setServicos(previous);
      setError('Nao foi possivel atualizar o status do servico.');
    }
  };

  const handleFilesChange = (key: string, files: FileList | null) => {
    const category = documentCategories.find((item) => item.key === key);
    if (!category) {
      return;
    }

    const selected = Array.from(files ?? []);
    const limited = category.maxFiles ? selected.slice(0, category.maxFiles) : selected.slice(0, 1);
    setUploadedFiles((current) => ({ ...current, [key]: limited }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Servicos</h1>
          <p className="mt-1 max-w-3xl text-gray-400">
            Implementacao baseada nas paginas 9 a 16 do documento: Ligacao Nova, Aumento de Carga, Troca de Titularidade,
            Alteracao Compartilhamento de Credito e kanban com 11 etapas.
          </p>
        </div>
        <Link to="/servicos/novo">
          <Button type="button">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Servico
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Servicos</div><div className="mt-2 text-3xl font-semibold text-slate-100">{stats.total}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Em aberto</div><div className="mt-2 text-3xl font-semibold text-slate-100">{stats.abertas}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aprovados</div><div className="mt-2 text-3xl font-semibold text-slate-100">{stats.aprovadas}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Receita prevista</div><div className="mt-2 text-2xl font-semibold text-slate-100">{formatCurrencyBRL(stats.valor)}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px_260px]">
            <Input
              placeholder="Buscar por protocolo, cliente, tipo ou concessionaria..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              icon={<MagnifyingGlass />}
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as 'todos' | TipoServico)}
              className="h-[46px] rounded-xl border border-white/20 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35"
            >
              <option value="todos">Todos os tipos</option>
              {tipoServicoOptions.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'todos' | StatusServico)}
              className="h-[46px] rounded-xl border border-white/20 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35"
            >
              <option value="todos">Todos os status</option>
              {servicosService.statusFlow.map((item) => (
                <option key={item.status} value={item.status}>{item.etapa}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      {formOpen && (
        <Card className="border-cyan-300/20">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle>{editingId ? 'Editar Servico' : 'Novo Servico'}</CardTitle>
                <p className="mt-1 text-sm text-slate-400">Formulario estruturado conforme o documento funcional.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
                <X className="mr-2 h-4 w-4" />
                Fechar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Tipo de Servico</label>
                  <select value={form.tipo} onChange={(event) => setForm((prev) => ({ ...prev, tipo: event.target.value as TipoServico }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                    {tipoServicoOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                  <p className="mt-2 text-xs text-slate-400">{tipoServicoOptions.find((item) => item.value === form.tipo)?.description}</p>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Cliente cadastrado</label>
                  <select value={form.clienteId} onChange={(event) => setForm((prev) => ({ ...prev, clienteId: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                    <option value="">Selecionar depois / nome manual</option>
                    {clientes.map((customer) => <option key={customer.id} value={customer.id}>{customer.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Nome do cliente</label>
                  <input value={form.clienteId ? selectedCustomer?.nome ?? '' : form.clienteNomeManual} disabled={form.clienteId !== ''} onChange={(event) => setForm((prev) => ({ ...prev, clienteNomeManual: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue disabled:opacity-60" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Concessionaria</label>
                  <select value={form.concessionaria} onChange={(event) => setForm((prev) => ({ ...prev, concessionaria: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                    <option value="">Selecione...</option>
                    {concessionarias.map((item) => <option key={item.id} value={item.nome}>{item.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Data de Abertura</label>
                  <input type="date" value={form.dataAbertura} onChange={(event) => setForm((prev) => ({ ...prev, dataAbertura: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Custo do Servico (R$)</label>
                  <input value={form.valor} onChange={(event) => setForm((prev) => ({ ...prev, valor: event.target.value.replace(/[^0-9.,]/g, '') }))} placeholder="Ex: 1200,00" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Cupom de desconto</label>
                  <select value={form.cupomDescontoPct} onChange={(event) => setForm((prev) => ({ ...prev, cupomDescontoPct: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                    <option value="0">Sem desconto</option>
                    {cupons.map((item) => <option key={item.id} value={String(item.percentual)}>{item.nome} ({item.percentual}%)</option>)}
                  </select>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
                  <div className="text-xs uppercase tracking-wide text-emerald-200/80">Valor final</div>
                  <div className="mt-1 text-xl font-semibold text-emerald-100">{formatCurrencyBRL(valorFinal)}</div>
                </div>
              </div>

              {isTechnicalType(form.tipo) && (
                <Card className="border-white/10 bg-slate-950/30">
                  <CardHeader><CardTitle>Dados Tecnicos do Servico</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Endereco da Obra</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, enderecoObra: normalizeAddressFromCustomer(selectedCustomer) }))}>Usar endereco do cliente</Button>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input value={form.enderecoObra.cep} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, cep: maskCep(event.target.value) } }))} onBlur={() => void fillAddressFromCep(form.enderecoObra.cep, (endereco) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, cep: maskCep(endereco.cep), logradouro: endereco.logradouro || prev.enderecoObra.logradouro, complemento: prev.enderecoObra.complemento || endereco.complemento, bairro: endereco.bairro || prev.enderecoObra.bairro, cidade: endereco.cidade || prev.enderecoObra.cidade, estado: endereco.estado || prev.enderecoObra.estado } })))} placeholder="CEP" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoObra.numero} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, numero: event.target.value } }))} placeholder="Numero" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoObra.logradouro} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, logradouro: event.target.value } }))} placeholder="Logradouro" className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoObra.complemento} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, complemento: event.target.value } }))} placeholder="Complemento" className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoObra.bairro} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, bairro: event.target.value } }))} placeholder="Bairro" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoObra.cidade} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, cidade: event.target.value } }))} placeholder="Cidade" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input maxLength={2} value={form.enderecoObra.estado} onChange={(event) => setForm((prev) => ({ ...prev, enderecoObra: { ...prev.enderecoObra, estado: event.target.value.toUpperCase() } }))} placeholder="UF" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                      <div>
                        <label className="mb-2 block text-sm text-slate-300">Tensao de Fornecimento</label>
                        <select value={form.tensaoFornecimento} onChange={(event) => setForm((prev) => ({ ...prev, tensaoFornecimento: event.target.value as ServicoForm['tensaoFornecimento'] }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                          <option value="">Selecione...</option>
                          <option value="127/220V">127/220V</option>
                          <option value="380/220V">380/220V</option>
                        </select>
                      </div>
                      <div><label className="mb-2 block text-sm text-slate-300">Latitude</label><input value={form.latitude} onChange={(event) => setForm((prev) => ({ ...prev, latitude: maskLatitude(event.target.value) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></div>
                      <div><label className="mb-2 block text-sm text-slate-300">Longitude</label><input value={form.longitude} onChange={(event) => setForm((prev) => ({ ...prev, longitude: maskLongitude(event.target.value) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></div>
                      <div>
                        <label className="mb-2 block text-sm text-slate-300">Padrao a mais de 30m</label>
                        <select value={form.padraoMaisDe30m} onChange={(event) => setForm((prev) => ({ ...prev, padraoMaisDe30m: event.target.value as 'nao' | 'sim' }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                          <option value="nao">Nao</option>
                          <option value="sim">Sim</option>
                        </select>
                      </div>
                      <div><label className="mb-2 block text-sm text-slate-300">Ponto de Referencia</label><input value={form.pontoReferencia} onChange={(event) => setForm((prev) => ({ ...prev, pontoReferencia: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Quantitativos / Disjuntores</h4>
                        <Button type="button" variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, padraoEntradaItens: [...prev.padraoEntradaItens, buildPadraoItem()] }))}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar linha
                        </Button>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="min-w-full divide-y divide-white/10">
                          <thead className="bg-slate-950/50">
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                              <th className="px-4 py-3">Tipo de Ligacao</th>
                              <th className="px-4 py-3">Classificacao</th>
                              <th className="px-4 py-3">Quantidade</th>
                              <th className="px-4 py-3">Disjuntor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {form.padraoEntradaItens.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3">
                                  <select value={item.tipoLigacao} onChange={(event) => setForm((prev) => ({ ...prev, padraoEntradaItens: prev.padraoEntradaItens.map((line) => line.id === item.id ? { ...line, tipoLigacao: event.target.value } : line) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                                    {tipoLigacaoOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-3">
                                  <select value={item.classificacao} onChange={(event) => setForm((prev) => ({ ...prev, padraoEntradaItens: prev.padraoEntradaItens.map((line) => line.id === item.id ? { ...line, classificacao: event.target.value } : line) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">
                                    {classificacaoOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                                  </select>
                                </td>
                                <td className="px-4 py-3"><input value={item.quantidade} onChange={(event) => setForm((prev) => ({ ...prev, padraoEntradaItens: prev.padraoEntradaItens.map((line) => line.id === item.id ? { ...line, quantidade: maskNumeric(event.target.value, 4) } : line) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></td>
                                <td className="px-4 py-3"><input value={item.disjuntor} onChange={(event) => setForm((prev) => ({ ...prev, padraoEntradaItens: prev.padraoEntradaItens.map((line) => line.id === item.id ? { ...line, disjuntor: event.target.value } : line) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {canUseRateioType(form.tipo) && (
                <Card className="border-white/10 bg-slate-950/30">
                  <CardHeader><CardTitle>Compartilhamento de Credito</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm text-slate-300">UC Geradora</label>
                        <input value={form.ucGeradora} onChange={(event) => setForm((prev) => ({ ...prev, ucGeradora: maskNumeric(event.target.value, 20) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      </div>
                      <div className="flex items-end">
                        <Button type="button" variant="outline" onClick={() => setForm((prev) => ({ ...prev, enderecoGeradora: normalizeAddressFromCustomer(selectedCustomer) }))}>
                          Usar endereco do cliente
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input value={form.enderecoGeradora.cep} onChange={(event) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, cep: maskCep(event.target.value) } }))} onBlur={() => void fillAddressFromCep(form.enderecoGeradora.cep, (endereco) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, cep: maskCep(endereco.cep), logradouro: endereco.logradouro || prev.enderecoGeradora.logradouro, complemento: prev.enderecoGeradora.complemento || endereco.complemento, bairro: endereco.bairro || prev.enderecoGeradora.bairro, cidade: endereco.cidade || prev.enderecoGeradora.cidade, estado: endereco.estado || prev.enderecoGeradora.estado } })))} placeholder="CEP" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoGeradora.numero} onChange={(event) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, numero: event.target.value } }))} placeholder="Numero" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoGeradora.logradouro} onChange={(event) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, logradouro: event.target.value } }))} placeholder="Logradouro" className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoGeradora.bairro} onChange={(event) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, bairro: event.target.value } }))} placeholder="Bairro" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input value={form.enderecoGeradora.cidade} onChange={(event) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, cidade: event.target.value } }))} placeholder="Cidade" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                      <input maxLength={2} value={form.enderecoGeradora.estado} onChange={(event) => setForm((prev) => ({ ...prev, enderecoGeradora: { ...prev.enderecoGeradora, estado: event.target.value.toUpperCase() } }))} placeholder="UF" className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Rateio das Beneficiarias</h4>
                        <Button type="button" variant="outline" size="sm" onClick={() => setForm((prev) => ({ ...prev, rateios: [...prev.rateios, buildRateio()] }))}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar beneficiaria
                        </Button>
                      </div>
                      <div className="overflow-x-auto rounded-xl border border-white/10">
                        <table className="min-w-full divide-y divide-white/10">
                          <thead className="bg-slate-950/50">
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                              <th className="px-4 py-3">UC</th>
                              <th className="px-4 py-3">Endereco</th>
                              <th className="px-4 py-3">Classificacao</th>
                              <th className="px-4 py-3">Porcentagem</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {form.rateios.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3"><input value={item.uc} onChange={(event) => setForm((prev) => ({ ...prev, rateios: prev.rateios.map((row) => row.id === item.id ? { ...row, uc: maskNumeric(event.target.value, 20) } : row) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></td>
                                <td className="px-4 py-3"><input value={item.endereco} onChange={(event) => setForm((prev) => ({ ...prev, rateios: prev.rateios.map((row) => row.id === item.id ? { ...row, endereco: event.target.value } : row) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></td>
                                <td className="px-4 py-3"><select value={item.classe} onChange={(event) => setForm((prev) => ({ ...prev, rateios: prev.rateios.map((row) => row.id === item.id ? { ...row, classe: event.target.value } : row) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue">{classificacaoOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select></td>
                                <td className="px-4 py-3"><input value={item.percentual} onChange={(event) => setForm((prev) => ({ ...prev, rateios: prev.rateios.map((row) => row.id === item.id ? { ...row, percentual: maskNumeric(event.target.value, 3) } : row) }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div>
                <label className="mb-2 block text-sm text-slate-300">Observacoes / Comentarios</label>
                <textarea value={form.observacoes} rows={4} onChange={(event) => setForm((prev) => ({ ...prev, observacoes: event.target.value }))} className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue" />
              </div>
              <Card className="border-white/10 bg-slate-950/30">
                <CardHeader><CardTitle>Uploads</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {documentCategories.map((item) => (
                    <label key={item.key} className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-slate-900/40 px-4 py-5 text-center hover:border-cyan-300/50">
                      <div className="text-sm font-medium text-slate-100">{item.label}</div>
                      <div className="mt-2 text-xs text-slate-400">
                        {(uploadedFiles[item.key] ?? []).length > 0
                          ? `${(uploadedFiles[item.key] ?? []).length} arquivo(s) selecionado(s)`
                          : item.maxFiles ? `Selecionar ate ${item.maxFiles} arquivos` : 'Selecionar arquivo'}
                      </div>
                      <input type="file" className="hidden" multiple={Boolean(item.maxFiles && item.maxFiles > 1)} onChange={(event) => handleFilesChange(item.key, event.target.files)} />
                    </label>
                  ))}
                </CardContent>
              </Card>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
                <Button type="submit" loading={saving}>
                  <FloppyDisk className="mr-2 h-4 w-4" />
                  {editingId ? 'Salvar servico' : 'Criar servico'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {servicosService.statusFlow.map((column) => (
            <Card key={column.status} className={`w-[340px] shrink-0 border ${statusColumnStyles[column.status]}`}>
              <CardContent className="p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{column.etapa}</h2>
                  <span className="rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-slate-300">{groupedServicos[column.status].length}</span>
                </div>
                <div className="space-y-3" onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()} onDrop={(event: React.DragEvent<HTMLDivElement>) => {
                  if (!canManageStatus) return;
                  event.preventDefault();
                  const id = event.dataTransfer.getData('text/service-id');
                  if (!id) return;
                  setDraggedId(null);
                  void updateStatus(id, column.status);
                }}>
                  {groupedServicos[column.status].map((servico) => (
                    <div key={servico.id} draggable={canManageStatus} onDragStart={(event) => {
                      if (!canManageStatus) return;
                      setDraggedId(servico.id);
                      event.dataTransfer.setData('text/service-id', servico.id);
                    }} onDragEnd={() => setDraggedId(null)} className={`rounded-xl border border-white/10 bg-slate-900/80 p-4 transition hover:border-cyan-300/40 hover:bg-slate-800/80 ${draggedId === servico.id ? 'opacity-50' : ''}`}>
                      <div className="mb-2 text-xs uppercase tracking-wide text-cyan-200">{servico.protocolo}</div>
                      <div className="text-sm font-semibold text-slate-100">{servico.nome}</div>
                      <div className="mt-1 text-sm text-slate-300">{servico.cliente}</div>
                      <div className="mt-1 text-xs text-slate-400">{getTipoLabel(servico.tipo)} • {servico.concessionaria || 'Sem concessionaria'}</div>
                      <div className="mt-1 text-xs text-slate-400">Abertura: {new Date(servico.dataAbertura).toLocaleDateString('pt-BR')}</div>
                      <div className="mt-1 text-xs text-slate-400">Valor final: {formatCurrencyBRL(servico.valorFinal)}</div>
                      <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                        {servico.tipo === 'alteracao_compartilhamento_credito' ? `UC Geradora: ${servico.ucGeradora || '-'}` : `Endereco: ${formatAddressSummary(servico.enderecoObra)}`}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <select value={servico.status} onChange={(event) => void updateStatus(servico.id, event.target.value as StatusServico)} disabled={!canManageStatus} className="min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950/70 px-2 py-1 text-xs text-slate-200">
                          {servicosService.statusFlow.map((option) => <option key={option.status} value={option.status}>{option.etapa}</option>)}
                        </select>
                        <Link to={`/servicos/${servico.id}`}>
                          <Button type="button" variant="outline" size="sm">Abrir</Button>
                        </Link>
                        <Link to={`/servicos/${servico.id}?tab=editar`}>
                          <Button type="button" variant="outline" size="sm">
                            <PencilSimple className="mr-1 h-4 w-4" />
                            Editar
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {groupedServicos[column.status].length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-slate-400">Nenhum servico nesta coluna.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
