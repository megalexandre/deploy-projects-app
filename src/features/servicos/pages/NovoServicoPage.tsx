import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FloppyDisk, PlusCircle } from '@phosphor-icons/react';
import { Link, useNavigate } from 'react-router-dom';
import { ConcessionaireSelect } from '@/features/concessionaries/components/ConcessionaireSelect';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import {
  addressService,
  concessionairesService,
  customersService,
  filesService,
  servicosService,
  usersService,
  viaCepService,
  type Concessionaire,
  type Customer,
  type User,
} from '@/services';
import type { DivisaoCreditos, Documento, Endereco, PadraoEntradaItem, TipoServico } from '@/types';
import type {
  ClienteForm,
  ModoCliente,
  Passo,
  TipoDocumento,
} from '@/features/projects/domain/types';
import { Passo1Cliente } from '@/features/projects/components/form/passo1/Passo1Cliente';
import {
  getCuponsDescontoServicosAtivos,
  loadConfiguracoesSistema,
  loadConfiguracoesSistemaFromApi,
} from '@/utils/configuracoesSistema';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import {
  formatCurrencyBRL,
  maskCep,
  maskLatitude,
  maskLongitude,
  maskNumeric,
  onlyDigits,
  parseCoordinate,
} from '@/core/utils/masks';

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

interface DocumentoCategoria {
  key: string;
  label: string;
  maxFiles?: number;
}

interface DocumentoSelecionado {
  categoria: string;
  file: File;
}

interface ServicoForm {
  tipo: TipoServico;
  concessionaria: string;
  dataAbertura: string;
  valor: string;
  cupomDescontoPct: string;
  integradorId: string;
  subsequencia: string;
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

const tipoServicoOptions: Array<{ value: TipoServico; label: string; description: string }> = [
  {
    value: 'ligacao_nova',
    label: 'Ligação Nova',
    description: 'Endereço da obra, tensão, coordenadas, padrão e uploads.',
  },
  {
    value: 'aumento_carga',
    label: 'Aumento de Carga',
    description: 'Mesmo fluxo técnico de ligação nova, com anexos da unidade atual.',
  },
  {
    value: 'troca_titularidade',
    label: 'Troca de Titularidade',
    description: 'Usa o mesmo fluxo técnico e os mesmos campos de aumento de carga.',
  },
  {
    value: 'alteracao_compartilhamento_credito',
    label: 'Alteração no Compartilhamento de Crédito',
    description: 'UC geradora, endereço e rateio das beneficiárias.',
  },
];

const tipoLigacaoOptions = ['Monofásico', 'Bifásico', 'Trifásico'];
const classificacaoOptions = ['Residencial', 'Comercial', 'Industrial', 'Rural', 'Condomínio'];

const emptyAddress = (): AddressForm => ({
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  estado: '',
});
const buildPadraoItem = (): PadraoEntradaItemForm => ({
  id: crypto.randomUUID(),
  tipoLigacao: 'Monofásico',
  classificacao: 'Residencial',
  quantidade: '',
  disjuntor: '',
});
const buildRateio = (): RateioForm => ({
  id: crypto.randomUUID(),
  uc: '',
  endereco: '',
  classe: 'Residencial',
  percentual: '',
});

const createEmptyForm = (): ServicoForm => ({
  tipo: 'ligacao_nova',
  concessionaria: '',
  dataAbertura: new Date().toISOString().slice(0, 10),
  valor: '',
  cupomDescontoPct: '0',
  integradorId: '',
  subsequencia: '',
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
  rateios: [buildRateio()],
});

const personDocuments: Record<PersonType, DocumentoCategoria[]> = {
  cpf: [
    { key: 'cnh', label: 'CNH' },
    { key: 'procuracao_pf', label: 'Procuração' },
  ],
  cnpj: [
    { key: 'contrato_social', label: 'Contrato Social' },
    { key: 'cartao_cnpj', label: 'Cartão CNPJ' },
    { key: 'documentacao_socios', label: 'Documentação do(s) Sócio(s)' },
    { key: 'procuracao_pj', label: 'Procuração' },
  ],
};

const documentCategoriesByType: Record<TipoServico, DocumentoCategoria[]> = {
  ligacao_nova: [
    { key: 'matricula_imovel', label: 'Matrícula do Imóvel' },
    { key: 'foto_padrao_instalado', label: 'Foto do padrão instalado', maxFiles: 3 },
    { key: 'outros', label: 'Outros', maxFiles: 5 },
  ],
  aumento_carga: [
    { key: 'conta_energia_atual', label: 'Conta de Energia atual' },
    { key: 'foto_padrao_entrada_atual', label: 'Foto do Padrão de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 },
  ],
  troca_titularidade: [
    { key: 'conta_energia', label: 'Conta de Energia' },
    { key: 'foto_padrao_atual', label: 'Foto do Padrão de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 },
  ],
  alteracao_compartilhamento_credito: [
    { key: 'conta_geradora', label: 'Conta de Energia da Geradora' },
    { key: 'contas_beneficiarias', label: 'Conta de Energia da(s) Beneficiárias', maxFiles: 5 },
    { key: 'foto_padrao_atual', label: 'Foto do Padrão de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 },
  ],
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
        estado: customer.endereco.estado ?? '',
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
  estado: address.estado.trim().toUpperCase(),
});
const isTechnicalType = (tipo: TipoServico) =>
  tipo === 'ligacao_nova' || tipo === 'aumento_carga' || tipo === 'troca_titularidade';
const canUseRateioType = (tipo: TipoServico) => tipo === 'alteracao_compartilhamento_credito';
const isRateioStarted = (item: RateioForm) =>
  Boolean(item.uc.trim() || item.endereco.trim() || item.percentual.trim());
const isRateioComplete = (item: RateioForm) =>
  Boolean(
    item.uc.trim() && item.endereco.trim() && item.classe.trim() && Number(item.percentual) > 0,
  );
const getActiveRateios = (rateios: RateioForm[]) => rateios.filter(isRateioStarted);
const getRateioTotal = (rateios: RateioForm[]) =>
  getActiveRateios(rateios).reduce((total, item) => total + Number(item.percentual), 0);
const areRateiosValid = (rateios: RateioForm[]) => {
  const activeRateios = getActiveRateios(rateios);
  return (
    activeRateios.length > 0 &&
    activeRateios.every(isRateioComplete) &&
    Math.abs(getRateioTotal(activeRateios) - 100) < 0.01
  );
};
const getPersonType = (customer?: Customer | null): PersonType =>
  (customer?.cpfCnpj.replace(/\D/g, '').length ?? 0) > 11 ? 'cnpj' : 'cpf';
const buildDocumentCategories = (
  tipo: TipoServico,
  personType: PersonType,
): DocumentoCategoria[] => [
  ...documentCategoriesByType[tipo].filter((item) => item.key !== 'outros'),
  ...personDocuments[personType],
  ...documentCategoriesByType[tipo].filter((item) => item.key === 'outros'),
];
const buildSelectedDocumentFiles = (
  filesByCategory: Record<string, File[]>,
  categories: DocumentoCategoria[],
): DocumentoSelecionado[] =>
  categories.flatMap((category) =>
    (filesByCategory[category.key] ?? []).map((file) => ({
      categoria: category.label,
      file,
    })),
  );

const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2 pt-1">
    {Array.from({ length: total }, (_, index) => index + 1).map((step) => (
      <div
        key={step}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
          current >= step ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        {step}
      </div>
    ))}
  </div>
);

export const NovoServicoPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [passoAtual, setPassoAtual] = useState<Passo>(1);
  const [modoCliente, setModoCliente] = useState<ModoCliente | null>(null);
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteForm, setClienteForm] = useState<ClienteForm>({
    nome: '',
    cpfCnpj: '',
    telefone: '',
    email: '',
    endereco: emptyAddress(),
  });
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [concessionarias, setConcessionarias] = useState<Concessionaire[]>([]);
  const [integradores, setIntegradores] = useState<Array<Pick<User, 'id' | 'name'>>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<ServicoForm>(createEmptyForm());
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  const [selectedCustomerDocumentIds, setSelectedCustomerDocumentIds] = useState<string[]>([]);
  const [configuracoesSistema, setConfiguracoesSistema] = useState(() =>
    loadConfiguracoesSistema(),
  );
  useEffect(() => {
    void loadConfiguracoesSistemaFromApi()
      .then(setConfiguracoesSistema)
      .catch((error) => console.error('Erro ao carregar cupons de serviços:', error));
  }, []);
  const cupons = useMemo(() => {
    if (!currentUser?.id) return [];
    return getCuponsDescontoServicosAtivos(configuracoesSistema).filter((cupom) =>
      (cupom.usuariosAutorizados ?? []).includes(currentUser.id),
    );
  }, [configuracoesSistema, currentUser?.id]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [clientesData, concessionariasData] = await Promise.all([
          customersService.getAll().catch(() => []),
          concessionairesService.getAll().catch(() => []),
        ]);
        setClientes(clientesData);
        setConcessionarias(concessionariasData);
      } catch (loadError) {
        console.error('Erro ao carregar dados do novo serviço:', loadError);
        setError('Não foi possível carregar os dados para criar o serviço.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadIntegradores = async () => {
      if (!currentUser) return;

      if (!currentUser.isAdmin) {
        const integradorAtual = {
          id: currentUser.id,
          name: currentUser.name.trim() || currentUser.email,
        };
        setIntegradores([integradorAtual]);
        setForm((prev) => ({ ...prev, integradorId: integradorAtual.id }));
        return;
      }

      try {
        const users = await usersService.getAll();
        setIntegradores(
          users
            .map((user) => ({ id: user.id, name: user.name.trim() || user.email }))
            .filter((user) => user.id && user.name)
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
        );
      } catch (loadError) {
        console.error('Erro ao carregar integradores:', loadError);
      }
    };

    void loadIntegradores();
  }, [currentUser]);

  const selectedCustomer = useMemo(
    () => clientes.find((item) => item.id === clienteSelecionadoId) ?? null,
    [clienteSelecionadoId, clientes],
  );
  const clientesFiltrados = useMemo(() => {
    const query = buscaCliente.trim().toLocaleLowerCase('pt-BR');
    if (!query) return clientes;

    return clientes.filter((cliente) =>
      [cliente.nome, cliente.cpfCnpj, cliente.telefone, cliente.email].some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(query),
      ),
    );
  }, [buscaCliente, clientes]);
  const personType = useMemo(
    () => (modoCliente === 'novo' ? tipoDocumento : getPersonType(selectedCustomer)),
    [modoCliente, selectedCustomer, tipoDocumento],
  );
  const documentCategories = useMemo(
    () => buildDocumentCategories(form.tipo, personType),
    [form.tipo, personType],
  );
  const valor = useMemo(() => Number(form.valor.replace(',', '.')) || 0, [form.valor]);
  const valorFinal = useMemo(
    () => Math.max(valor - valor * (Number(form.cupomDescontoPct) / 100), 0),
    [form.cupomDescontoPct, valor],
  );
  const inputClass = (invalid = false, extra = '') =>
    [
      'w-full rounded border bg-gray-800 px-3 py-3 text-gray-100',
      invalid ? 'border-red-400 ring-1 ring-red-400/50' : 'border-gray-600',
      extra,
    ]
      .filter(Boolean)
      .join(' ');

  useEffect(() => {
    if (
      form.cupomDescontoPct !== '0' &&
      !cupons.some((cupom) => String(cupom.percentual) === form.cupomDescontoPct)
    ) {
      setForm((prev) => ({ ...prev, cupomDescontoPct: '0' }));
    }
  }, [cupons, form.cupomDescontoPct]);

  useEffect(() => {
    setUploadedFiles((current) =>
      documentCategories.reduce<Record<string, File[]>>((acc, item) => {
        acc[item.key] = current[item.key] ?? [];
        return acc;
      }, {}),
    );
  }, [documentCategories]);

  useEffect(() => {
    setSelectedCustomerDocumentIds([]);
  }, [clienteSelecionadoId]);

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

  const validarPasso1 = () => {
    if (modoCliente === 'existente') return Boolean(clienteSelecionadoId);
    if (modoCliente !== 'novo') return false;

    const documentLength = tipoDocumento === 'cpf' ? 11 : 14;
    return (
      clienteForm.nome.trim().length >= 2 &&
      onlyDigits(clienteForm.cpfCnpj).length === documentLength &&
      onlyDigits(clienteForm.telefone).length >= 10 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteForm.email.trim()) &&
      isAddressValid(clienteForm.endereco)
    );
  };

  const validateForm = () => {
    const coordenadasValidas =
      !isTechnicalType(form.tipo) ||
      (parseCoordinate(form.latitude) !== null && parseCoordinate(form.longitude) !== null);
    const enderecoObraValido = !isTechnicalType(form.tipo) || isAddressValid(form.enderecoObra);
    const enderecoGeradoraValido =
      !canUseRateioType(form.tipo) || isAddressValid(form.enderecoGeradora);
    const rateioValido = !canUseRateioType(form.tipo) || areRateiosValid(form.rateios);
    const ucGeradoraValida = !canUseRateioType(form.tipo) || form.ucGeradora.trim() !== '';
    return (
      validarPasso1() &&
      form.integradorId.trim() !== '' &&
      form.concessionaria.trim() !== '' &&
      form.dataAbertura.trim() !== '' &&
      valor > 0 &&
      coordenadasValidas &&
      enderecoObraValido &&
      enderecoGeradoraValido &&
      ucGeradoraValida &&
      rateioValido
    );
  };

  const getMissingFields = () => {
    const missing: string[] = [];

    if (!validarPasso1()) missing.push('cliente');
    if (!form.integradorId.trim()) missing.push('integrador');
    if (!form.concessionaria.trim()) missing.push('concessionária');
    if (!form.dataAbertura.trim()) missing.push('data de abertura');
    if (valor <= 0) missing.push('valor do serviço');

    if (isTechnicalType(form.tipo)) {
      if (!isAddressValid(form.enderecoObra)) missing.push('endereço da obra completo');
      if (parseCoordinate(form.latitude) === null) missing.push('latitude válida');
      if (parseCoordinate(form.longitude) === null) missing.push('longitude válida');
    }

    if (canUseRateioType(form.tipo)) {
      if (!form.ucGeradora.trim()) missing.push('UC geradora');
      if (!isAddressValid(form.enderecoGeradora)) missing.push('endereço da geradora completo');
      const activeRateios = getActiveRateios(form.rateios);
      if (activeRateios.length === 0) {
        missing.push('ao menos um rateio');
      } else if (!activeRateios.every(isRateioComplete)) {
        missing.push('todos os campos dos rateios iniciados');
      } else if (Math.abs(getRateioTotal(activeRateios) - 100) >= 0.01) {
        missing.push('soma dos rateios igual a 100%');
      }
    }

    return missing;
  };

  const handleFilesChange = (key: string, files: FileList | null) => {
    const category = documentCategories.find((item) => item.key === key);
    if (!category) return;
    const selected = Array.from(files ?? []);
    setUploadedFiles((current) => ({
      ...current,
      [key]: category.maxFiles ? selected.slice(0, category.maxFiles) : selected.slice(0, 1),
    }));
  };

  const reusedDocuments = useMemo(
    () =>
      (selectedCustomer?.documentos ?? []).filter((documento) =>
        selectedCustomerDocumentIds.includes(documento.id),
      ),
    [selectedCustomer?.documentos, selectedCustomerDocumentIds],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    const missingFields = getMissingFields();
    if (missingFields.length > 0 || !validateForm()) {
      setError(`Preencha os campos obrigatórios: ${missingFields.join(', ')}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let clienteId = clienteSelecionadoId;
      let clienteNome = selectedCustomer?.nome ?? '';

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
        });
        const novoCliente = await customersService.create({
          nome: clienteForm.nome.trim(),
          addressId: enderecoCliente.id,
          cpfCnpj: onlyDigits(clienteForm.cpfCnpj),
          telefone: onlyDigits(clienteForm.telefone),
          email: clienteForm.email.trim(),
        });
        clienteId = novoCliente.id;
        clienteNome = novoCliente.nome;
      }

      if (!clienteId) {
        setPassoAtual(1);
        throw new Error('Selecione ou cadastre um cliente para continuar.');
      }

      const integradorSelecionado = integradores.find(
        (integrador) => integrador.id === form.integradorId,
      );
      const servicoCriado = await servicosService.create({
        tipo: form.tipo,
        clienteId,
        cliente: clienteNome,
        integradorId: form.integradorId,
        subsequencia: form.subsequencia,
        integradorNome: integradorSelecionado?.name,
        concessionaria: form.concessionaria,
        dataAbertura: form.dataAbertura,
        valor,
        cupomDescontoPct: Number(form.cupomDescontoPct),
        observacoes: form.observacoes.trim(),
        tensaoFornecimento: isTechnicalType(form.tipo)
          ? form.tensaoFornecimento || undefined
          : undefined,
        coordenadas: isTechnicalType(form.tipo)
          ? { latitude: maskLatitude(form.latitude), longitude: maskLongitude(form.longitude) }
          : undefined,
        pontoReferencia: isTechnicalType(form.tipo) ? form.pontoReferencia.trim() : undefined,
        padraoMaisDe30m: isTechnicalType(form.tipo) ? form.padraoMaisDe30m : undefined,
        enderecoObra: isTechnicalType(form.tipo) ? toEnderecoPayload(form.enderecoObra) : undefined,
        ucGeradora: canUseRateioType(form.tipo) ? form.ucGeradora.trim() : undefined,
        enderecoGeradora: canUseRateioType(form.tipo)
          ? toEnderecoPayload(form.enderecoGeradora)
          : undefined,
        padraoEntradaItens: isTechnicalType(form.tipo)
          ? form.padraoEntradaItens
              .filter((item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== '')
              .map<PadraoEntradaItem>((item) => ({
                id: item.id,
                tipoLigacao: item.tipoLigacao,
                classificacao: item.classificacao,
                quantidade: Number(item.quantidade) || 0,
                disjuntor: item.disjuntor.trim(),
              }))
          : [],
        rateios: canUseRateioType(form.tipo)
          ? form.rateios
              .filter(
                (item) => item.uc.trim() && item.endereco.trim() && Number(item.percentual) > 0,
              )
              .map<DivisaoCreditos>((item) => ({
                uc: item.uc.trim(),
                endereco: item.endereco.trim(),
                classe: item.classe,
                percentual: Number(item.percentual) || 0,
              }))
          : [],
        documentos: [],
      });

      const documentosSelecionados = buildSelectedDocumentFiles(uploadedFiles, documentCategories);

      if (documentosSelecionados.length > 0) {
        // O backend gera um fileId por anexo e ele passa a ser a referencia oficial para download.
        const uploadedDocuments = await filesService.uploadFiles(
          servicoCriado.id,
          documentosSelecionados.map((item) => item.file),
        );

        await servicosService.saveDocuments(servicoCriado.id, [
          ...reusedDocuments,
          ...uploadedDocuments.map(
            (uploadedDocument, index): Documento => ({
              id: uploadedDocument.id,
              fileId: uploadedDocument.id,
              nome: uploadedDocument.fileName,
              tipo: documentosSelecionados[index]?.categoria ?? 'Documento',
              dataUpload: uploadedDocument.createdAt ?? new Date().toISOString(),
              tamanho: uploadedDocument.size,
              url: uploadedDocument.urlS3,
            }),
          ),
        ]);
      } else if (reusedDocuments.length > 0) {
        await servicosService.saveDocuments(servicoCriado.id, reusedDocuments);
      }

      navigate('/servicos');
    } catch (saveError) {
      console.error('Erro ao criar serviço:', saveError);
      setError(
        saveError instanceof Error && saveError.message.trim()
          ? saveError.message
          : 'Não foi possível criar o serviço.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/servicos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Novo Serviço</h1>
            <p className="mt-1 text-xl text-gray-400">Passo {passoAtual} de 3</p>
          </div>
        </div>
        <StepIndicator current={passoAtual} total={3} />
      </div>

      {error && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      {passoAtual === 1 && (
        <Card>
          <CardContent className="p-6">
            <Passo1Cliente
              entityLabel="Serviço"
              modoCliente={modoCliente}
              setModoCliente={setModoCliente}
              tipoDocumento={tipoDocumento}
              setTipoDocumento={setTipoDocumento}
              clienteForm={clienteForm}
              setClienteForm={setClienteForm}
              clientesFiltrados={clientesFiltrados}
              clientesLoading={false}
              clienteSelecionadoId={clienteSelecionadoId}
              setClienteSelecionadoId={setClienteSelecionadoId}
              buscaCliente={buscaCliente}
              setBuscaCliente={setBuscaCliente}
              fillAddressFromCep={fillAddressFromCep}
              validarPasso1={validarPasso1}
              setPassoAtual={setPassoAtual}
              setErro={setError}
            />
          </CardContent>
        </Card>
      )}

      {passoAtual === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas do Serviço</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Tipo de Serviço</label>
              <select
                value={form.tipo}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tipo: event.target.value as TipoServico }))
                }
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
              >
                {tipoServicoOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-slate-400">
                {tipoServicoOptions.find((item) => item.value === form.tipo)?.description}
              </p>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Integrador</label>
              <select
                value={form.integradorId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, integradorId: event.target.value }))
                }
                disabled={currentUser?.isAdmin === false}
                className={inputClass(submitAttempted && !form.integradorId.trim())}
              >
                <option value="">Selecione...</option>
                {integradores.map((integrador) => (
                  <option key={integrador.id} value={integrador.id}>
                    {integrador.name}
                  </option>
                ))}
              </select>
              <label className="mt-3 block text-sm text-slate-300">
                Subsequência (opcional)
                <input
                  aria-label="Subsequência"
                  maxLength={50}
                  value={form.subsequencia}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, subsequencia: event.target.value }))
                  }
                  className={inputClass(false)}
                />
              </label>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Concessionária</label>
              <ConcessionaireSelect
                value={form.concessionaria}
                onChange={(value) => setForm((prev) => ({ ...prev, concessionaria: value }))}
                concessionarias={concessionarias}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Data de Abertura</label>
              <input
                type="date"
                value={form.dataAbertura}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, dataAbertura: event.target.value }))
                }
                className={inputClass(submitAttempted && !form.dataAbertura.trim())}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Custo do Serviço</label>
              <input
                value={form.valor}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    valor: event.target.value.replace(/[^0-9.,]/g, ''),
                  }))
                }
                className={inputClass(submitAttempted && valor <= 0)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Cupom</label>
              <select
                value={form.cupomDescontoPct}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, cupomDescontoPct: event.target.value }))
                }
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
              >
                <option value="0">Sem desconto</option>
                {cupons.map((item) => (
                  <option key={item.id} value={String(item.percentual)}>
                    {item.nome} ({item.percentual}%)
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-emerald-200/80">Valor final</div>
              <div className="mt-1 text-xl font-semibold text-emerald-100">
                {formatCurrencyBRL(valorFinal)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {passoAtual === 2 && (isTechnicalType(form.tipo) || canUseRateioType(form.tipo)) && (
        <Card>
          <CardHeader>
            <CardTitle>Dados Específicos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isTechnicalType(form.tipo) && (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-100">Endereço da Obra</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra:
                          modoCliente === 'novo'
                            ? { ...clienteForm.endereco }
                            : normalizeAddressFromCustomer(selectedCustomer),
                      }))
                    }
                  >
                    Usar endereço do cliente
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={form.enderecoObra.cep}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: { ...prev.enderecoObra, cep: maskCep(event.target.value) },
                      }))
                    }
                    onBlur={() =>
                      void fillAddressFromCep(form.enderecoObra.cep, (endereco) =>
                        setForm((prev) => ({
                          ...prev,
                          enderecoObra: {
                            ...prev.enderecoObra,
                            cep: maskCep(endereco.cep),
                            logradouro: endereco.logradouro || prev.enderecoObra.logradouro,
                            complemento: prev.enderecoObra.complemento || endereco.complemento,
                            bairro: endereco.bairro || prev.enderecoObra.bairro,
                            cidade: endereco.cidade || prev.enderecoObra.cidade,
                            estado: endereco.estado || prev.enderecoObra.estado,
                          },
                        })),
                      )
                    }
                    placeholder="CEP"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        onlyDigits(form.enderecoObra.cep).length !== 8,
                    )}
                  />
                  <input
                    value={form.enderecoObra.numero}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: { ...prev.enderecoObra, numero: event.target.value },
                      }))
                    }
                    placeholder="Número"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        !form.enderecoObra.numero.trim(),
                    )}
                  />
                  <input
                    value={form.enderecoObra.logradouro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: { ...prev.enderecoObra, logradouro: event.target.value },
                      }))
                    }
                    placeholder="Logradouro"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        form.enderecoObra.logradouro.trim().length < 3,
                      'md:col-span-2',
                    )}
                  />
                  <input
                    value={form.enderecoObra.complemento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: { ...prev.enderecoObra, complemento: event.target.value },
                      }))
                    }
                    placeholder="Complemento"
                    className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                  <input
                    value={form.enderecoObra.bairro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: { ...prev.enderecoObra, bairro: event.target.value },
                      }))
                    }
                    placeholder="Bairro"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        form.enderecoObra.bairro.trim().length < 2,
                    )}
                  />
                  <input
                    value={form.enderecoObra.cidade}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: { ...prev.enderecoObra, cidade: event.target.value },
                      }))
                    }
                    placeholder="Cidade"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        form.enderecoObra.cidade.trim().length < 2,
                    )}
                  />
                  <input
                    maxLength={2}
                    value={form.enderecoObra.estado}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoObra: {
                          ...prev.enderecoObra,
                          estado: event.target.value.toUpperCase(),
                        },
                      }))
                    }
                    placeholder="UF"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        form.enderecoObra.estado.trim().length !== 2,
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <select
                    value={form.tensaoFornecimento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        tensaoFornecimento: event.target.value as ServicoForm['tensaoFornecimento'],
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  >
                    <option value="">Selecione a tensão...</option>
                    <option value="127/220V">127/220V</option>
                    <option value="380/220V">380/220V</option>
                  </select>
                  <input
                    value={form.latitude}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, latitude: maskLatitude(event.target.value) }))
                    }
                    placeholder="Latitude"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        parseCoordinate(form.latitude) === null,
                    )}
                  />
                  <input
                    value={form.longitude}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, longitude: maskLongitude(event.target.value) }))
                    }
                    placeholder="Longitude"
                    className={inputClass(
                      submitAttempted &&
                        isTechnicalType(form.tipo) &&
                        parseCoordinate(form.longitude) === null,
                    )}
                  />
                  <select
                    value={form.padraoMaisDe30m}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        padraoMaisDe30m: event.target.value as 'nao' | 'sim',
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  >
                    <option value="nao">Padrão até 30m</option>
                    <option value="sim">Padrão acima de 30m</option>
                  </select>
                  <input
                    value={form.pontoReferencia}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, pontoReferencia: event.target.value }))
                    }
                    placeholder="Ponto de referência"
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-100">
                      Quantitativos / Disjuntores
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          padraoEntradaItens: [...prev.padraoEntradaItens, buildPadraoItem()],
                        }))
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar linha
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-slate-950/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Classificação
                          </th>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Quantidade
                          </th>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Disjuntor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {form.padraoEntradaItens.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <select
                                value={item.tipoLigacao}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                      line.id === item.id
                                        ? { ...line, tipoLigacao: event.target.value }
                                        : line,
                                    ),
                                  }))
                                }
                                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
                              >
                                {tipoLigacaoOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={item.classificacao}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                      line.id === item.id
                                        ? { ...line, classificacao: event.target.value }
                                        : line,
                                    ),
                                  }))
                                }
                                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
                              >
                                {classificacaoOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={item.quantidade}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                      line.id === item.id
                                        ? {
                                            ...line,
                                            quantidade: maskNumeric(event.target.value, 4),
                                          }
                                        : line,
                                    ),
                                  }))
                                }
                                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={item.disjuntor}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    padraoEntradaItens: prev.padraoEntradaItens.map((line) =>
                                      line.id === item.id
                                        ? { ...line, disjuntor: event.target.value }
                                        : line,
                                    ),
                                  }))
                                }
                                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            {canUseRateioType(form.tipo) && (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={form.ucGeradora}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        ucGeradora: maskNumeric(event.target.value, 20),
                      }))
                    }
                    placeholder="UC Geradora"
                    className={inputClass(
                      submitAttempted && canUseRateioType(form.tipo) && !form.ucGeradora.trim(),
                    )}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: normalizeAddressFromCustomer(selectedCustomer),
                      }))
                    }
                  >
                    Usar endereço do cliente
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={form.enderecoGeradora.cep}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          cep: maskCep(event.target.value),
                        },
                      }))
                    }
                    onBlur={() =>
                      void fillAddressFromCep(form.enderecoGeradora.cep, (endereco) =>
                        setForm((prev) => ({
                          ...prev,
                          enderecoGeradora: {
                            ...prev.enderecoGeradora,
                            cep: maskCep(endereco.cep),
                            logradouro: endereco.logradouro || prev.enderecoGeradora.logradouro,
                            complemento: prev.enderecoGeradora.complemento || endereco.complemento,
                            bairro: endereco.bairro || prev.enderecoGeradora.bairro,
                            cidade: endereco.cidade || prev.enderecoGeradora.cidade,
                            estado: endereco.estado || prev.enderecoGeradora.estado,
                          },
                        })),
                      )
                    }
                    placeholder="CEP da geradora"
                    className={inputClass(
                      submitAttempted &&
                        canUseRateioType(form.tipo) &&
                        onlyDigits(form.enderecoGeradora.cep).length !== 8,
                    )}
                  />
                  <input
                    value={form.enderecoGeradora.numero}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          numero: event.target.value,
                        },
                      }))
                    }
                    placeholder="Número da geradora"
                    className={inputClass(
                      submitAttempted &&
                        canUseRateioType(form.tipo) &&
                        !form.enderecoGeradora.numero.trim(),
                    )}
                  />
                  <input
                    value={form.enderecoGeradora.logradouro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          logradouro: event.target.value,
                        },
                      }))
                    }
                    placeholder="Logradouro da geradora"
                    className={inputClass(
                      submitAttempted &&
                        canUseRateioType(form.tipo) &&
                        form.enderecoGeradora.logradouro.trim().length < 3,
                      'md:col-span-2',
                    )}
                  />
                  <input
                    value={form.enderecoGeradora.complemento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          complemento: event.target.value,
                        },
                      }))
                    }
                    placeholder="Complemento"
                    className="md:col-span-2 w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                  <input
                    value={form.enderecoGeradora.bairro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          bairro: event.target.value,
                        },
                      }))
                    }
                    placeholder="Bairro"
                    className={inputClass(
                      submitAttempted &&
                        canUseRateioType(form.tipo) &&
                        form.enderecoGeradora.bairro.trim().length < 2,
                    )}
                  />
                  <input
                    value={form.enderecoGeradora.cidade}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          cidade: event.target.value,
                        },
                      }))
                    }
                    placeholder="Cidade"
                    className={inputClass(
                      submitAttempted &&
                        canUseRateioType(form.tipo) &&
                        form.enderecoGeradora.cidade.trim().length < 2,
                    )}
                  />
                  <input
                    maxLength={2}
                    value={form.enderecoGeradora.estado}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        enderecoGeradora: {
                          ...prev.enderecoGeradora,
                          estado: event.target.value.toUpperCase(),
                        },
                      }))
                    }
                    placeholder="UF"
                    className={inputClass(
                      submitAttempted &&
                        canUseRateioType(form.tipo) &&
                        form.enderecoGeradora.estado.trim().length !== 2,
                    )}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-slate-100">
                      Rateio das Beneficiárias
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({ ...prev, rateios: [...prev.rateios, buildRateio()] }))
                      }
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Adicionar beneficiaria
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="min-w-full divide-y divide-white/10">
                      <thead className="bg-slate-950/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            UC
                          </th>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Endereço
                          </th>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Classe
                          </th>
                          <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-slate-400">
                            Percentual
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {form.rateios.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-3">
                              <input
                                value={item.uc}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    rateios: prev.rateios.map((row) =>
                                      row.id === item.id
                                        ? { ...row, uc: maskNumeric(event.target.value, 20) }
                                        : row,
                                    ),
                                  }))
                                }
                                className={inputClass(
                                  submitAttempted && canUseRateioType(form.tipo) && !item.uc.trim(),
                                  'py-2',
                                )}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={item.endereco}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    rateios: prev.rateios.map((row) =>
                                      row.id === item.id
                                        ? { ...row, endereco: event.target.value }
                                        : row,
                                    ),
                                  }))
                                }
                                className={inputClass(
                                  submitAttempted &&
                                    canUseRateioType(form.tipo) &&
                                    !item.endereco.trim(),
                                  'py-2',
                                )}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={item.classe}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    rateios: prev.rateios.map((row) =>
                                      row.id === item.id
                                        ? { ...row, classe: event.target.value }
                                        : row,
                                    ),
                                  }))
                                }
                                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100"
                              >
                                {classificacaoOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input
                                value={item.percentual}
                                onChange={(event) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    rateios: prev.rateios.map((row) =>
                                      row.id === item.id
                                        ? { ...row, percentual: maskNumeric(event.target.value, 3) }
                                        : row,
                                    ),
                                  }))
                                }
                                className={inputClass(
                                  submitAttempted &&
                                    canUseRateioType(form.tipo) &&
                                    Number(item.percentual) <= 0,
                                  'py-2',
                                )}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p
                    className={`text-sm ${
                      submitAttempted &&
                      canUseRateioType(form.tipo) &&
                      Math.abs(getRateioTotal(form.rateios) - 100) >= 0.01
                        ? 'text-red-300'
                        : 'text-slate-400'
                    }`}
                  >
                    Total do rateio: {getRateioTotal(form.rateios)}% (deve totalizar 100%).
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {passoAtual === 2 && (
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => setPassoAtual(1)}>
            Voltar
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSubmitAttempted(true);
              const missingFields = getMissingFields();
              if (missingFields.length > 0 || !validateForm()) {
                setError(`Preencha os campos obrigatórios: ${missingFields.join(', ')}.`);
                return;
              }
              setError(null);
              setPassoAtual(3);
            }}
          >
            Próximo Passo
          </Button>
        </div>
      )}

      {passoAtual === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Observações e Uploads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Observações / Comentários</label>
              <textarea
                value={form.observacoes}
                rows={4}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, observacoes: event.target.value }))
                }
                className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
              />
            </div>
            {selectedCustomer && selectedCustomer.documentos.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Reaproveitar documentos do cliente
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedCustomer.nome} já possui {selectedCustomer.documentos.length}{' '}
                      documento(s) cadastrado(s).
                    </p>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-200">
                    {reusedDocuments.length} selecionado(s)
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedCustomer.documentos.map((documento) => (
                    <label
                      key={documento.id}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-sm text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCustomerDocumentIds.includes(documento.id)}
                        onChange={(event) =>
                          setSelectedCustomerDocumentIds((current) =>
                            event.target.checked
                              ? [...current, documento.id]
                              : current.filter((id) => id !== documento.id),
                          )
                        }
                        className="mt-1"
                      />
                      <span>
                        <strong className="block text-slate-100">{documento.nome}</strong>
                        <span className="block text-xs text-slate-400">{documento.tipo}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {documentCategories.map((item) => (
                <label
                  key={item.key}
                  className="cursor-pointer rounded-xl border border-dashed border-white/20 bg-slate-900/40 px-4 py-5 text-center hover:border-cyan-300/50"
                >
                  <div className="text-sm font-medium text-slate-100">{item.label}</div>
                  <div className="mt-2 text-xs text-slate-400">
                    {(uploadedFiles[item.key] ?? []).length > 0
                      ? `${(uploadedFiles[item.key] ?? []).length} arquivo(s) selecionado(s)`
                      : item.maxFiles
                        ? `Selecionar até ${item.maxFiles} arquivos`
                        : 'Selecionar arquivo'}
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple={Boolean(item.maxFiles && item.maxFiles > 1)}
                    onChange={(event) => handleFilesChange(item.key, event.target.files)}
                  />
                </label>
              ))}
            </div>
            <div className="flex justify-between gap-3">
              <Button type="button" variant="outline" onClick={() => setPassoAtual(2)}>
                Voltar
              </Button>
              <Button
                type="button"
                loading={saving}
                onClick={(event) => void handleSubmit(event as unknown as React.FormEvent)}
              >
                <FloppyDisk className="mr-2 h-4 w-4" />
                Criar serviço
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
