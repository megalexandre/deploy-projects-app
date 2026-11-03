import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  FloppyDisk,
  UploadSimple,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { ConfirmActionButton } from '@/shared/components/ConfirmActionButton';
import { DocumentRemoveButton } from '@/shared/components/DocumentRemoveButton';
import { serviceIdentifier } from '../domain/serviceIdentifier';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import {
  concessionairesService,
  customersService,
  filesService,
  servicosService,
  usersService,
  type Concessionaire,
  type Customer,
  type User,
} from '@/services';
import type { Documento, Endereco, Servico, StatusServico } from '@/types';
import {
  getCuponsDescontoServicosAtivos,
  loadConfiguracoesSistema,
  loadConfiguracoesSistemaFromApi,
} from '@/utils/configuracoesSistema';
import { formatCurrencyBRL, maskLatitude, maskLongitude } from '@/core/utils/masks';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { EntityFinanceTab } from '@/features/financeiro/components/EntityFinanceTab';

const mergeDocuments = (current: Documento[], incoming: Documento[]) => {
  const merged = new Map<string, Documento>();

  [...current, ...incoming].forEach((documento) => {
    merged.set(documento.fileId || documento.id, documento);
  });

  return Array.from(merged.values());
};

interface EditForm {
  subsequencia: string;
  clienteId: string;
  clienteNomeManual: string;
  concessionaria: string;
  dataAbertura: string;
  valor: string;
  cupomDescontoPct: string;
  observacoes: string;
  status: StatusServico;
  latitude: string;
  longitude: string;
  tensaoFornecimento: '' | '127/220V' | '380/220V';
  pontoReferencia: string;
  ucGeradora: string;
}

const isTechnicalType = (tipo: Servico['tipo']) =>
  tipo === 'ligacao_nova' || tipo === 'aumento_carga' || tipo === 'troca_titularidade';
const isRateioType = (tipo: Servico['tipo']) => tipo === 'alteracao_compartilhamento_credito';

const getTimelineIcon = (status: string) => {
  if (status === 'concluido') return <CheckCircle className="h-5 w-5 text-emerald-300" />;
  if (status === 'em_andamento') return <Clock className="h-5 w-5 text-cyan-300" />;
  return <Clock className="h-5 w-5 text-slate-400" />;
};

const formatDate = (value?: string) => {
  if (!value) return '-';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
};

const formatAddress = (address?: Endereco) => {
  if (!address) return '-';

  const street = [address.logradouro, address.numero].filter(Boolean).join(', ');
  const city = [address.cidade, address.estado].filter(Boolean).join('/');
  return [street, address.complemento, address.bairro, city, address.cep]
    .filter(Boolean)
    .join(' - ');
};

const handleDownload = async (fileId?: string) => {
  if (!fileId) {
    return;
  }

  try {
    await filesService.downloadFile(fileId);
  } catch (error) {
    console.error('Erro ao baixar documento do serviço:', error);
  }
};

const getStatusLabel = (status: StatusServico) =>
  servicosService.statusFlow.find((item) => item.status === status)?.etapa ?? status;

const buildForm = (servico: Servico): EditForm => ({
  subsequencia: servico.subsequencia ?? '',
  clienteId: servico.clienteId ?? '',
  clienteNomeManual: servico.clienteId ? '' : servico.cliente,
  concessionaria: servico.concessionaria,
  dataAbertura: servico.dataAbertura,
  valor: servico.valor ? String(servico.valor) : '',
  cupomDescontoPct: String(servico.cupomDescontoPct ?? 0),
  observacoes: servico.observacoes ?? '',
  status: servico.status,
  latitude: servico.coordenadas?.latitude ?? '',
  longitude: servico.coordenadas?.longitude ?? '',
  tensaoFornecimento: servico.tensaoFornecimento ?? '',
  pontoReferencia: servico.pontoReferencia ?? '',
  ucGeradora: servico.ucGeradora ?? '',
});

export const ServicoDetailPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const canManageStatus = currentUser?.isAdmin === true;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [servico, setServico] = useState<Servico | null>(null);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [concessionarias, setConcessionarias] = useState<Concessionaire[]>([]);
  const [users, setUsers] = useState<Array<Pick<User, 'id' | 'name'>>>([]);
  const [form, setForm] = useState<EditForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [selectedCustomerDocumentIds, setSelectedCustomerDocumentIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [configuracoesSistema, setConfiguracoesSistema] = useState(() =>
    loadConfiguracoesSistema(),
  );
  useEffect(() => {
    void loadConfiguracoesSistemaFromApi()
      .then(setConfiguracoesSistema)
      .catch((loadError) => console.error('Erro ao carregar cupons de serviços:', loadError));
  }, []);
  const cupons = useMemo(() => {
    if (!currentUser?.id) return [];
    return getCuponsDescontoServicosAtivos(configuracoesSistema).filter((cupom) =>
      (cupom.usuariosAutorizados ?? []).includes(currentUser.id),
    );
  }, [configuracoesSistema, currentUser?.id]);

  const activeTab = searchParams.get('tab') ?? 'dados';

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const [serviceData, customersData, utilitiesData, usersData] = await Promise.all([
          servicosService.getById(id),
          customersService.getAll().catch(() => []),
          concessionairesService.getAll().catch(() => []),
          currentUser?.isAdmin ? usersService.getAll().catch(() => []) : Promise.resolve([]),
        ]);
        setServico(serviceData);
        setClientes(customersData);
        setConcessionarias(utilitiesData);
        setUsers(usersData);
        setForm(buildForm(serviceData));
      } catch (loadError) {
        console.error('Erro ao carregar serviço:', loadError);
        setError('Não foi possível carregar o serviço.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [currentUser?.isAdmin, id]);

  const selectedCustomer = useMemo(
    () => clientes.find((item) => item.id === form?.clienteId) ?? null,
    [clientes, form?.clienteId],
  );
  const reusedDocuments = useMemo(
    () =>
      (selectedCustomer?.documentos ?? []).filter((documento) =>
        selectedCustomerDocumentIds.includes(documento.id),
      ),
    [selectedCustomer?.documentos, selectedCustomerDocumentIds],
  );
  const integradorNome = useMemo(() => {
    if (!servico) return 'Não informado';
    if (servico.integradorNome) return servico.integradorNome;

    const integradorId = servico.integradorId || servico.createdBy;
    if (currentUser?.id === integradorId) {
      return currentUser?.name || currentUser?.email || 'Não informado';
    }

    return users.find((user) => user.id === integradorId)?.name || 'Não informado';
  }, [currentUser, servico, users]);

  useEffect(() => {
    if (
      form?.cupomDescontoPct &&
      form.cupomDescontoPct !== '0' &&
      !cupons.some((cupom) => String(cupom.percentual) === form.cupomDescontoPct)
    ) {
      setForm((prev) => (prev ? { ...prev, cupomDescontoPct: '0' } : prev));
    }
  }, [cupons, form?.cupomDescontoPct]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!servico || !form) {
    return <div className="py-12 text-center text-slate-400">Serviço não encontrado.</div>;
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const valor = Number(form.valor.replace(',', '.')) || 0;
      const updated = await servicosService.update(servico.id, {
        subsequencia: form.subsequencia,
        clienteId: form.clienteId || undefined,
        cliente: form.clienteId
          ? (selectedCustomer?.nome ?? servico.cliente)
          : form.clienteNomeManual.trim(),
        concessionaria: form.concessionaria,
        dataAbertura: form.dataAbertura,
        valor,
        cupomDescontoPct: Number(form.cupomDescontoPct),
        observacoes: form.observacoes.trim(),
        status: form.status,
        coordenadas: isTechnicalType(servico.tipo)
          ? { latitude: maskLatitude(form.latitude), longitude: maskLongitude(form.longitude) }
          : undefined,
        tensaoFornecimento: isTechnicalType(servico.tipo)
          ? form.tensaoFornecimento || undefined
          : undefined,
        pontoReferencia: isTechnicalType(servico.tipo) ? form.pontoReferencia.trim() : undefined,
        ucGeradora: isRateioType(servico.tipo) ? form.ucGeradora.trim() : undefined,
      });
      setServico(updated);
      setForm(buildForm(updated));
      setSearchParams({ tab: 'dados' });
    } catch (saveError) {
      console.error('Erro ao salvar serviço:', saveError);
      setError('Não foi possível salvar o serviço.');
    } finally {
      setSaving(false);
    }
  };

  const valorFinal = Math.max(
    (Number(form.valor.replace(',', '.')) || 0) * (1 - Number(form.cupomDescontoPct) / 100),
    0,
  );

  const handleSaveDocuments = async (files: FileList | null) => {
    if (!servico) {
      return;
    }

    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0 && reusedDocuments.length === 0) {
      return;
    }

    setSavingDocuments(true);
    setError(null);

    try {
      let nextDocuments = [...servico.documentos];

      if (selectedFiles.length > 0) {
        const uploadedDocuments = await filesService.uploadFiles(servico.id, selectedFiles);
        nextDocuments = mergeDocuments(
          nextDocuments,
          uploadedDocuments.map(
            (uploadedDocument): Documento => ({
              id: uploadedDocument.id,
              fileId: uploadedDocument.id,
              nome: uploadedDocument.fileName,
              tipo: 'Documento',
              dataUpload: uploadedDocument.createdAt ?? new Date().toISOString(),
              tamanho: uploadedDocument.size,
              url: uploadedDocument.urlS3,
            }),
          ),
        );
      }

      if (reusedDocuments.length > 0) {
        nextDocuments = mergeDocuments(nextDocuments, reusedDocuments);
      }

      const updated = await servicosService.saveDocuments(servico.id, nextDocuments);
      setServico(updated);
      setSelectedCustomerDocumentIds([]);
    } catch (saveError) {
      console.error('Erro ao salvar documentos do serviço:', saveError);
      setError('Não foi possível salvar os documentos do serviço.');
    } finally {
      setSavingDocuments(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/servicos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{serviceIdentifier(servico)}</h1>
            {(currentUser?.isAdmin || servico.createdBy === currentUser?.id) && (
              <ConfirmActionButton
                label="Excluir serviço"
                description={`Excluir definitivamente o serviço ${serviceIdentifier(servico)}? Registros vinculados podem impedir a exclusão.`}
                onConfirm={async () => {
                  await servicosService.remove(servico.id);
                  navigate('/servicos');
                }}
              />
            )}
            <p className="mt-1 text-gray-400">
              {servico.nome} • {servico.cliente}
            </p>
          </div>
        </div>
        <span className="inline-flex rounded-full bg-cyan-500/10 px-3 py-1 text-sm font-semibold text-cyan-300">
          {getStatusLabel(servico.status)}
        </span>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <div className="border-b border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'dados', label: 'Dados' },
            { id: 'financeiro', label: 'Financeiro' },
            { id: 'timeline', label: 'Linha do Tempo' },
            { id: 'documentos', label: 'Documentos' },
            { id: 'editar', label: 'Editar' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ tab: tab.id })}
              className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${activeTab === tab.id ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dados' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400">Tipo de Serviço</label>
                <p className="text-gray-100">{servico.nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Integrador</label>
                <p className="text-gray-100">{integradorNome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Cliente</label>
                <p className="text-gray-100">{servico.cliente}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Concessionária</label>
                <p className="text-gray-100">{servico.concessionaria || '-'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Data de Abertura</label>
                <p className="text-gray-100">{formatDate(servico.dataAbertura)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Valor do serviço</label>
                <p className="text-gray-100">{formatCurrencyBRL(servico.valor)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Desconto</label>
                <p className="text-gray-100">{servico.cupomDescontoPct}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Valor final</label>
                <p className="text-gray-100">{formatCurrencyBRL(servico.valorFinal)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-400">Observações</label>
                <p className="whitespace-pre-wrap text-gray-100">{servico.observacoes || '-'}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalhes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isTechnicalType(servico.tipo) && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Endereço da obra</label>
                    <p className="text-gray-100">{formatAddress(servico.enderecoObra)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Tensão</label>
                    <p className="text-gray-100">{servico.tensaoFornecimento || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Coordenadas</label>
                    <p className="text-gray-100">
                      {servico.coordenadas
                        ? `${servico.coordenadas.latitude}, ${servico.coordenadas.longitude}`
                        : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Ponto de Referência</label>
                    <p className="text-gray-100">{servico.pontoReferencia || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Distância do padrão</label>
                    <p className="text-gray-100">
                      {servico.padraoMaisDe30m === 'sim' ? 'Acima de 30 metros' : 'Até 30 metros'}
                    </p>
                  </div>
                </>
              )}
              {isRateioType(servico.tipo) && (
                <>
                  <div>
                    <label className="text-sm font-medium text-gray-400">UC Geradora</label>
                    <p className="text-gray-100">{servico.ucGeradora || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Endereço da geradora
                    </label>
                    <p className="text-gray-100">{formatAddress(servico.enderecoGeradora)}</p>
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium text-gray-400">Última Atualização</label>
                <p className="text-gray-100">{formatDate(servico.dataAtualizacao)}</p>
              </div>
            </CardContent>
          </Card>

          {isTechnicalType(servico.tipo) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Itens do Padrão de Entrada</CardTitle>
              </CardHeader>
              <CardContent>
                {(servico.padraoEntradaItens ?? []).length === 0 ? (
                  <p className="text-gray-400">Nenhum item cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-4 py-3">Ligação</th>
                          <th className="px-4 py-3">Classificação</th>
                          <th className="px-4 py-3">Quantidade</th>
                          <th className="px-4 py-3">Disjuntor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {(servico.padraoEntradaItens ?? []).map((item) => (
                          <tr key={item.id} className="text-sm text-gray-200">
                            <td className="px-4 py-3">{item.tipoLigacao || '-'}</td>
                            <td className="px-4 py-3">{item.classificacao || '-'}</td>
                            <td className="px-4 py-3">{item.quantidade}</td>
                            <td className="px-4 py-3">{item.disjuntor || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {isRateioType(servico.tipo) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Rateio das Beneficiárias</CardTitle>
              </CardHeader>
              <CardContent>
                {(servico.rateios ?? []).length === 0 ? (
                  <p className="text-gray-400">Nenhum rateio cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                          <th className="px-4 py-3">UC</th>
                          <th className="px-4 py-3">Endereço</th>
                          <th className="px-4 py-3">Classe</th>
                          <th className="px-4 py-3">Percentual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {(servico.rateios ?? []).map((item, index) => (
                          <tr key={`${item.uc}-${index}`} className="text-sm text-gray-200">
                            <td className="px-4 py-3">{item.uc || '-'}</td>
                            <td className="px-4 py-3">{item.endereco || '-'}</td>
                            <td className="px-4 py-3">{item.classe || '-'}</td>
                            <td className="px-4 py-3">{item.percentual}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle>Linha do Tempo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {servico.timeline.map((item) => (
              <div key={item.id} className="flex items-start gap-4">
                <div className="mt-1 shrink-0">{getTimelineIcon(item.status)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-lg font-medium text-gray-100">{item.etapa}</h4>
                    <span className="text-sm text-gray-400">{formatDate(item.data)}</span>
                  </div>
                  {item.descricao && <p className="mt-1 text-sm text-gray-300">{item.descricao}</p>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'financeiro' && (
        <EntityFinanceTab
          entityType="servico"
          entityId={servico.id}
          entityLabel={servico.protocolo}
          amount={servico.valorFinal}
          createdAt={servico.dataCriacao}
        />
      )}

      {activeTab === 'documentos' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Documentos</CardTitle>
              {currentUser?.isAdmin && servico.documentos.length > 0 && (
                <ConfirmActionButton
                  label="Excluir arquivos enviados"
                  description="Excluir definitivamente os arquivos enviados diretamente para este serviço? Os arquivos reaproveitados do cliente serão preservados."
                  onConfirm={async () => {
                    setServico(await servicosService.removeDirectDocuments(servico.id));
                    setSelectedCustomerDocumentIds([]);
                  }}
                />
              )}
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/50">
                <UploadSimple className="mr-2 h-4 w-4" />
                {savingDocuments ? 'Enviando...' : 'Adicionar documentos'}
                <input
                  type="file"
                  className="hidden"
                  multiple
                  disabled={savingDocuments}
                  onChange={(event) => {
                    void handleSaveDocuments(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCustomer && selectedCustomer.documentos.length > 0 && (
              <div className="mb-6 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-100">
                      Reaproveitar documentos do cliente
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedCustomer.nome} possui {selectedCustomer.documentos.length}{' '}
                      documento(s) disponível(is).
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSaveDocuments(null)}
                    disabled={savingDocuments || reusedDocuments.length === 0}
                  >
                    Vincular selecionados
                  </Button>
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
            {servico.documentos.length === 0 ? (
              <p className="text-gray-400">Nenhum documento cadastrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                        Tipo
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                        Data
                      </th>
                      <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-gray-400">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {servico.documentos.map((documento) => (
                      <tr key={documento.id}>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          <div className="flex items-center">
                            <FileText className="mr-2 h-4 w-4 text-gray-400" />
                            {documento.nome}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{documento.tipo}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          {formatDate(documento.dataUpload)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => void handleDownload(documento.fileId)}
                            disabled={!documento.fileId}
                          >
                            Download
                          </Button>
                          <DocumentRemoveButton
                            itemId={servico.id}
                            document={documento}
                            canUnlink={
                              currentUser?.isAdmin || servico.createdBy === currentUser?.id
                            }
                            onRemove={(fileId) =>
                              servicosService.removeDocument(servico.id, fileId)
                            }
                            onRemoved={async () => {
                              setSelectedCustomerDocumentIds([]);
                              setServico(await servicosService.getById(servico.id));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'editar' && (
        <Card>
          <CardHeader>
            <CardTitle>Editar Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <label className="block text-sm text-slate-300">
                Subsequência
                <input
                  aria-label="Subsequência"
                  maxLength={50}
                  value={form.subsequencia}
                  onChange={(event) => setForm({ ...form, subsequencia: event.target.value })}
                  className="mt-2 block rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                />
              </label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Cliente cadastrado</label>
                  <select
                    value={form.clienteId}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, clienteId: event.target.value } : prev))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  >
                    <option value="">Selecionar depois / nome manual</option>
                    {clientes.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Nome do cliente</label>
                  <input
                    value={form.clienteId ? (selectedCustomer?.nome ?? '') : form.clienteNomeManual}
                    disabled={form.clienteId !== ''}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, clienteNomeManual: event.target.value } : prev,
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Concessionária</label>
                  <select
                    value={form.concessionaria}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, concessionaria: event.target.value } : prev,
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  >
                    <option value="">Selecione...</option>
                    {concessionarias.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, status: event.target.value as StatusServico } : prev,
                      )
                    }
                    disabled={!canManageStatus}
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 disabled:opacity-60"
                  >
                    {servicosService.statusFlow.map((item) => (
                      <option key={item.status} value={item.status}>
                        {item.etapa}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Data de Abertura</label>
                  <input
                    type="date"
                    value={form.dataAbertura}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, dataAbertura: event.target.value } : prev,
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Valor</label>
                  <input
                    value={form.valor}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? { ...prev, valor: event.target.value.replace(/[^0-9.,]/g, '') }
                          : prev,
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Cupom</label>
                  <select
                    value={form.cupomDescontoPct}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, cupomDescontoPct: event.target.value } : prev,
                      )
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
                  <div className="text-xs uppercase tracking-wide text-emerald-200/80">
                    Valor final
                  </div>
                  <div className="mt-1 text-xl font-semibold text-emerald-100">
                    {formatCurrencyBRL(valorFinal)}
                  </div>
                </div>
              </div>
              {isTechnicalType(servico.tipo) && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={form.tensaoFornecimento}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev
                          ? {
                              ...prev,
                              tensaoFornecimento: event.target
                                .value as EditForm['tensaoFornecimento'],
                            }
                          : prev,
                      )
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  >
                    <option value="">Selecione...</option>
                    <option value="127/220V">127/220V</option>
                    <option value="380/220V">380/220V</option>
                  </select>
                  <input
                    value={form.latitude}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, latitude: maskLatitude(event.target.value) } : prev,
                      )
                    }
                    placeholder="Latitude"
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                  <input
                    value={form.longitude}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, longitude: maskLongitude(event.target.value) } : prev,
                      )
                    }
                    placeholder="Longitude"
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                  <input
                    value={form.pontoReferencia}
                    onChange={(event) =>
                      setForm((prev) =>
                        prev ? { ...prev, pontoReferencia: event.target.value } : prev,
                      )
                    }
                    placeholder="Ponto de referência"
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                </div>
              )}
              {isRateioType(servico.tipo) && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">UC Geradora</label>
                  <input
                    value={form.ucGeradora}
                    onChange={(event) =>
                      setForm((prev) => (prev ? { ...prev, ucGeradora: event.target.value } : prev))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                  />
                </div>
              )}
              <div>
                <label className="mb-2 block text-sm text-slate-300">Observações</label>
                <textarea
                  value={form.observacoes}
                  onChange={(event) =>
                    setForm((prev) => (prev ? { ...prev, observacoes: event.target.value } : prev))
                  }
                  rows={4}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => navigate('/servicos')}>
                  Cancelar
                </Button>
                <Button type="submit" loading={saving}>
                  <FloppyDisk className="mr-2 h-4 w-4" />
                  Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
