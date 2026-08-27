/** Pagina 'ServicosPage': implementa cadastro e acompanhamento dos servicos descritos no documento funcional. */
import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, PlusCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Card, CardContent } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { filesService, servicosService, viaCepService, type Customer } from '@/services';
import type {
  DivisaoCreditos,
  Documento,
  Endereco,
  PadraoEntradaItem,
  StatusServico,
  TipoServico,
} from '@/types';
import {
  getCuponsDescontoServicosAtivos,
  loadConfiguracoesSistema,
  loadConfiguracoesSistemaFromApi,
} from '@/utils/configuracoesSistema';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import {
  formatCurrencyBRL,
  maskLatitude,
  maskLongitude,
  onlyDigits,
  parseCoordinate,
} from '@/core/utils/masks';
import { ServicoFormCard } from '../components/ServicoFormCard';
import { ServicoKanbanColumn } from '../components/ServicoKanbanColumn';
import { canUseRateioType, isTechnicalType, tipoServicoOptions } from '../domain/servicosOptions';
import { useServicosKanban } from '../hooks/useServicosKanban';

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
  tipoLigacao: 'Monofasico',
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
  rateios: [buildRateio()],
});

const personDocuments: Record<PersonType, DocumentoCategoria[]> = {
  cpf: [
    { key: 'cnh', label: 'CNH' },
    { key: 'procuracao_pf', label: 'Procuracao' },
  ],
  cnpj: [
    { key: 'contrato_social', label: 'Contrato Social' },
    { key: 'cartao_cnpj', label: 'Cartao CNPJ' },
    { key: 'documentacao_socios', label: 'Documentacao do(s) Socio(s)' },
    { key: 'procuracao_pj', label: 'Procuracao' },
  ],
};

const documentCategoriesByType: Record<TipoServico, DocumentoCategoria[]> = {
  ligacao_nova: [
    { key: 'matricula_imovel', label: 'Matricula do Imovel' },
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
    { key: 'contas_beneficiarias', label: 'Conta de Energia da(s) Beneficiarias', maxFiles: 5 },
    { key: 'foto_padrao_atual', label: 'Foto do Padrão de Entrada atual' },
    { key: 'outros', label: 'Outros', maxFiles: 5 },
  ],
};

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
const currencyTextToNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};
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
export const ServicosPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServicoForm>(createEmptyForm());
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
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
  const kanban = useServicosKanban();

  const selectedCustomer = useMemo(
    () => kanban.clientes.find((item) => item.id === form.clienteId) ?? null,
    [kanban.clientes, form.clienteId],
  );

  const personType = useMemo(() => getPersonType(selectedCustomer), [selectedCustomer]);
  const documentCategories = useMemo(
    () => buildDocumentCategories(form.tipo, personType),
    [form.tipo, personType],
  );
  const valorNumerico = useMemo(() => currencyTextToNumber(form.valor), [form.valor]);
  const descontoPct = Number(form.cupomDescontoPct);
  const valorFinal = useMemo(
    () => Math.max(valorNumerico - valorNumerico * (descontoPct / 100), 0),
    [descontoPct, valorNumerico],
  );

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

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setUploadedFiles({});
    kanban.setError(null);
  };

  const validateForm = () => {
    const clienteValido = form.clienteId !== '' || form.clienteNomeManual.trim().length >= 2;
    const valorValido = valorNumerico > 0;
    const coordenadasValidas =
      !isTechnicalType(form.tipo) ||
      (parseCoordinate(form.latitude) !== null && parseCoordinate(form.longitude) !== null);
    const enderecoObraValido = !isTechnicalType(form.tipo) || isAddressValid(form.enderecoObra);
    const enderecoGeradoraValido =
      !canUseRateioType(form.tipo) || isAddressValid(form.enderecoGeradora);
    const ucGeradoraValida = !canUseRateioType(form.tipo) || form.ucGeradora.trim().length >= 3;
    const tensaoValida = !isTechnicalType(form.tipo) || form.tensaoFornecimento !== '';
    const padraoValido =
      !isTechnicalType(form.tipo) ||
      form.padraoEntradaItens.some(
        (item) => Number(item.quantidade) > 0 || item.disjuntor.trim() !== '',
      );
    const rateioValido =
      !canUseRateioType(form.tipo) ||
      form.rateios.some(
        (item) => item.uc.trim() && item.endereco.trim() && Number(item.percentual) > 0,
      );

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
      kanban.setError('Preencha os campos obrigatorios do serviço antes de salvar.');
      return;
    }

    setSaving(true);
    kanban.setError(null);

    try {
      const documentosExistentes = editingId
        ? (kanban.servicos.find((item) => item.id === editingId)?.documentos ?? [])
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
        tensaoFornecimento: isTechnicalType(form.tipo)
          ? form.tensaoFornecimento || undefined
          : undefined,
        coordenadas: isTechnicalType(form.tipo)
          ? {
              latitude: maskLatitude(form.latitude),
              longitude: maskLongitude(form.longitude),
            }
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
        documentos: documentosExistentes,
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
          documentosSelecionados.map((item) => item.file),
        );

        service = await servicosService.saveDocuments(service.id, [
          ...documentosExistentes,
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
      }

      kanban.setServicos((current) => {
        const exists = current.some((item) => item.id === service.id);
        return exists
          ? current.map((item) => (item.id === service.id ? service : item))
          : [service, ...current];
      });

      resetForm();
      setFormOpen(false);
    } catch (saveError) {
      console.error('Erro ao salvar serviço:', saveError);
      kanban.setError('Nao foi possivel salvar o serviço.');
    } finally {
      setSaving(false);
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

  if (kanban.loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Serviços</h1>
        </div>
        <Link to="/servicos/novo">
          <Button type="button">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Serviços</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{kanban.stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Em aberto</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{kanban.stats.abertas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aprovados</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">
              {kanban.stats.aprovadas}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Receita prevista
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {formatCurrencyBRL(kanban.stats.valor)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_240px_260px]">
            <Input
              placeholder="Buscar por protocolo, cliente, tipo ou concessionaria..."
              value={kanban.searchTerm}
              onChange={(event) => kanban.setSearchTerm(event.target.value)}
              icon={<MagnifyingGlass />}
            />
            <select
              value={kanban.typeFilter}
              onChange={(event) =>
                kanban.setTypeFilter(event.target.value as 'todos' | TipoServico)
              }
              className="h-[46px] rounded-xl border border-white/20 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35"
            >
              <option value="todos">Todos os tipos</option>
              {tipoServicoOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={kanban.statusFilter}
              onChange={(event) =>
                kanban.setStatusFilter(event.target.value as 'todos' | StatusServico)
              }
              className="h-[46px] rounded-xl border border-white/20 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35"
            >
              <option value="todos">Todos os status</option>
              {servicosService.statusFlow.map((item) => (
                <option key={item.status} value={item.status}>
                  {item.etapa}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {kanban.error && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {kanban.error}
        </div>
      )}

      {formOpen && (
        <ServicoFormCard
          editingId={editingId}
          form={form}
          setForm={setForm}
          selectedCustomer={selectedCustomer}
          clientes={kanban.clientes}
          concessionarias={kanban.concessionarias}
          cupons={cupons}
          valorFinal={valorFinal}
          documentCategories={documentCategories}
          uploadedFiles={uploadedFiles}
          saving={saving}
          onClose={() => {
            setFormOpen(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
          onFilesChange={handleFilesChange}
          fillAddressFromCep={fillAddressFromCep}
        />
      )}
      <div
        ref={kanban.containerRef}
        className={[
          'hide-scrollbar overflow-x-auto pb-2',
          'touch-pan-y select-none',
          kanban.isDragging ? 'cursor-grabbing' : 'cursor-grab',
        ].join(' ')}
        {...kanban.dragBindings}
      >
        <div className="flex min-w-max snap-x snap-mandatory items-start gap-4">
          {kanban.visibleStatusColumns.map((column) => (
            <ServicoKanbanColumn
              key={column.status}
              column={column}
              servicos={kanban.groupedServicos[column.status]}
              draggedId={kanban.draggedId}
              canManageStatus={kanban.canManageStatus}
              onDragStart={kanban.handleDragStart}
              onDragEnd={() => kanban.setDraggedId(null)}
              onDrop={kanban.handleDrop}
              onStatusChange={(serviceId, nextStatus) =>
                void kanban.updateStatus(serviceId, nextStatus)
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};
