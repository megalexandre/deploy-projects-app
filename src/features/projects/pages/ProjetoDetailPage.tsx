/** Pagina 'ProjetoDetailPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChatCircleText,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  PlusCircle,
  UploadSimple,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { customersService, filesService, projectsService, type Customer } from '@/services';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { Documento, Projeto } from '@/types';
import { maskCpfOrCnpj, maskPhoneBR, onlyDigits } from '@/core/utils/masks';
import { TimelineCommentsDialog } from '../components/TimelineCommentsDialog';

const mergeDocuments = (current: Documento[], incoming: Documento[]) => {
  const merged = new Map<string, Documento>();

  [...current, ...incoming].forEach((documento) => {
    merged.set(documento.fileId || documento.id, documento);
  });

  return Array.from(merged.values());
};

export const ProjetoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [clienteDetalhe, setClienteDetalhe] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dados');
  const [selectedCustomerDocumentIds, setSelectedCustomerDocumentIds] = useState<string[]>([]);
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [timelineDialogItem, setTimelineDialogItem] = useState<Projeto['timeline'][number] | null>(
    null,
  );
  const [timelineDialogMode, setTimelineDialogMode] = useState<'view' | 'add'>('view');
  const [timelineComment, setTimelineComment] = useState('');
  const [savingTimelineComment, setSavingTimelineComment] = useState(false);
  const currentUser = useCurrentUser();

  useEffect(() => {
    if (id) {
      void loadProjeto(id);
    }
  }, [id]);

  const loadProjeto = async (projetoId: string) => {
    try {
      const data = await projectsService.getProjetoById(projetoId);
      if (!data) {
        setProjeto(null);
        setClienteDetalhe(null);
        return;
      }
      setProjeto(data);
      if (data.cliente.id && data.cliente.id !== 'sem-cliente') {
        const customer = await customersService.getById(data.cliente.id).catch(() => null);
        setClienteDetalhe(customer);
      } else {
        setClienteDetalhe(null);
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'projeto_encerrado':
      case 'concluido':
        return 'text-green-400 bg-green-900/20';
      case 'aguardando_aprovacao':
        return 'text-amber-200 bg-amber-700/20';
      case 'em_analise_concessionaria':
      case 'em_andamento':
        return 'text-cyan-300 bg-cyan-500/10';
      case 'em_analise_documentacao':
      case 'pendente':
        return 'text-yellow-300 bg-yellow-500/10';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const handleDownload = async (fileId?: string) => {
    if (!fileId) {
      return;
    }

    try {
      await filesService.downloadFile(fileId);
    } catch (error) {
      console.error('Erro ao baixar documento do projeto:', error);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aguardando_aprovacao':
        return 'Aguardando Aprovacao';
      case 'projeto_encerrado':
        return 'Projeto Encerrado';
      case 'em_analise_documentacao':
        return 'Em Analise de Documentacao';
      case 'elaboracao_documentacao_tecnica':
        return 'Elaboracao de Documentacao Tecnica';
      case 'aguardando_assinatura_cliente':
        return 'Aguardando Assinatura do Cliente';
      case 'projeto_enviado_aguardando_protocolo_concessionaria':
        return 'Aguardando Protocolo da Concessionaria';
      case 'em_analise_concessionaria':
        return 'Em Analise da Concessionaria';
      case 'ressalvas_projetos':
        return 'Ressalvas do Projeto';
      case 'obras_concessionaria':
        return 'Obras da Concessionaria';
      case 'projeto_aprovado':
        return 'Projeto Aprovado';
      case 'vistoria_solicitada':
        return 'Vistoria Solicitada';
      case 'vistoria_reprovada':
        return 'Vistoria Reprovada';
      case 'aguardando_pagamento':
        return 'Aguardando Pagamento';
      default:
        return status;
    }
  };

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'concluido':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'em_andamento':
        return <Clock className="h-5 w-5 text-cyan-300" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '-';
    }

    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatModalidade = (modalidade: string) => {
    switch (modalidade) {
      case 'geracao_compartilhada':
        return 'Geracao Compartilhada';
      case 'autoconsumo_remoto':
        return 'Autoconsumo Remoto';
      case 'autoconsumo_local':
        return 'Autoconsumo Local';
      default:
        return modalidade || '-';
    }
  };

  const formatTipoProjeto = (tipoProjeto?: string) => {
    if (tipoProjeto === 'fotovoltaico') {
      return 'Projeto Fotovoltaico';
    }

    if (tipoProjeto === 'padrao_entrada') {
      return 'Padrao de Entrada';
    }

    return tipoProjeto || '-';
  };

  const formatBinaryChoice = (value?: string) => {
    if (!value) {
      return '-';
    }

    if (value === 'sim') {
      return 'Sim';
    }

    if (value === 'nao') {
      return 'Nao';
    }

    if (value === 'nao_ampliacao') {
      return 'Nao, Ampliacao';
    }

    return value;
  };

  const formatDocumento = (value?: string) => (value ? maskCpfOrCnpj(value) : '-');
  const formatTelefone = (value?: string) => (value ? maskPhoneBR(onlyDigits(value)) : '-');
  const reusedDocuments = useMemo(
    () =>
      (clienteDetalhe?.documentos ?? []).filter((documento) =>
        selectedCustomerDocumentIds.includes(documento.id),
      ),
    [clienteDetalhe?.documentos, selectedCustomerDocumentIds],
  );
  const potenciaTotalModulos =
    projeto?.modulos.reduce((total, item) => total + item.quantidade * item.potencia, 0) ?? 0;
  const potenciaTotalInversores =
    projeto?.inversores.reduce((total, item) => total + item.quantidade * item.potencia, 0) ?? 0;
  const potenciaTotalSistema =
    potenciaTotalModulos > 0 && potenciaTotalInversores > 0
      ? Math.min(potenciaTotalModulos, potenciaTotalInversores)
      : Math.max(potenciaTotalModulos, potenciaTotalInversores);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!projeto) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">Projeto nao encontrado.</div>
      </div>
    );
  }

  const handleSaveDocuments = async (files: FileList | null) => {
    if (!projeto) {
      return;
    }

    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0 && reusedDocuments.length === 0) {
      return;
    }

    setSavingDocuments(true);

    try {
      let nextDocuments = [...projeto.documentos];

      if (selectedFiles.length > 0) {
        const uploadedFiles = await filesService.uploadFiles(projeto.id, selectedFiles);
        nextDocuments = mergeDocuments(
          nextDocuments,
          uploadedFiles.map(
            (uploadedFile): Documento => ({
              id: uploadedFile.id,
              fileId: uploadedFile.id,
              nome: uploadedFile.fileName,
              tipo: 'Documento',
              dataUpload: uploadedFile.createdAt ?? new Date().toISOString(),
              tamanho: uploadedFile.size,
              url: uploadedFile.urlS3,
            }),
          ),
        );
      }

      if (reusedDocuments.length > 0) {
        nextDocuments = mergeDocuments(nextDocuments, reusedDocuments);
      }

      projectsService.saveDocuments(projeto.id, nextDocuments);
      setProjeto((current) => (current ? { ...current, documentos: nextDocuments } : current));
      setSelectedCustomerDocumentIds([]);
    } catch (error) {
      console.error('Erro ao salvar documentos do projeto:', error);
    } finally {
      setSavingDocuments(false);
    }
  };

  const tabs = [
    { id: 'dados', label: 'Dados do Projeto' },
    { id: 'tecnicos', label: 'Dados Tecnicos' },
    { id: 'timeline', label: 'Linha do Tempo' },
    { id: 'documentos', label: 'Documentos' },
  ];

  const openTimelineDialog = (item: Projeto['timeline'][number], mode: 'view' | 'add') => {
    setTimelineDialogItem(item);
    setTimelineDialogMode(mode);
    setTimelineComment('');
  };

  const handleSaveTimelineComment = async () => {
    if (!projeto || !timelineDialogItem) return;

    const texto = timelineComment.trim();
    if (!texto) return;

    setSavingTimelineComment(true);

    try {
      const comentarios = [
        ...(timelineDialogItem.comentarios ?? []),
        {
          id: crypto.randomUUID(),
          texto,
          data: new Date().toISOString(),
          autor: currentUser?.name || undefined,
        },
      ];

      projectsService.saveTimelineComments(projeto.id, timelineDialogItem.id, comentarios);

      setProjeto((current) =>
        current
          ? {
              ...current,
              timeline: current.timeline.map((item) =>
                item.id === timelineDialogItem.id ? { ...item, comentarios } : item,
              ),
            }
          : current,
      );
      setTimelineDialogItem((current) => (current ? { ...current, comentarios } : current));
      setTimelineComment('');
      setTimelineDialogMode('view');
    } finally {
      setSavingTimelineComment(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/projetos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-100">{projeto.protocolo}</h1>
            <p className="text-gray-400 mt-1">{projeto.cliente.nome}</p>
          </div>
        </div>
        <span
          className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(projeto.status)}`}
        >
          {getStatusText(projeto.status)}
        </span>
      </div>

      <div className="border-b border-gray-700">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="space-y-6 page-enter">
        {activeTab === 'dados' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Informacoes do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Nome</label>
                  <p className="text-gray-100">{projeto.cliente.nome || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">CPF/CNPJ</label>
                  <p className="text-gray-100">{formatDocumento(projeto.cliente.cpfCnpj)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Telefone</label>
                  <p className="text-gray-100">{formatTelefone(projeto.cliente.telefone)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">E-mail</label>
                  <p className="text-gray-100">{projeto.cliente.email || '-'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endereco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Endereco</label>
                  <p className="text-gray-100">
                    {projeto.endereco.logradouro || '-'}
                    {projeto.endereco.numero ? `, ${projeto.endereco.numero}` : ''}
                    {projeto.endereco.complemento ? ` - ${projeto.endereco.complemento}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Bairro</label>
                  <p className="text-gray-100">{projeto.endereco.bairro || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Cidade/UF</label>
                  <p className="text-gray-100">
                    {projeto.endereco.cidade || '-'}
                    {projeto.endereco.estado ? `/${projeto.endereco.estado}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">CEP</label>
                  <p className="text-gray-100">{projeto.endereco.cep || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Link / Coordenadas</label>
                  <div className="space-y-1">
                    <p className="text-gray-100">
                      {projeto.coordenadas
                        ? `${projeto.coordenadas.latitude}, ${projeto.coordenadas.longitude}`
                        : '-'}
                    </p>
                    {projeto.endereco.link && (
                      <a
                        href={projeto.endereco.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 break-all"
                      >
                        {projeto.endereco.link}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Concessionaria</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.concessionaria || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Classe</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.classe || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Integrador</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.integrador || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Modalidade</label>
                  <p className="text-gray-100">
                    {formatModalidade(projeto.dadosProjeto.modalidade)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Potencia do Sistema</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.potenciaSistema} kWp</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Numero da UC</label>
                  <p className="text-gray-100">{projeto.numeroUc || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Tipo de Projeto</label>
                  <p className="text-gray-100">{formatTipoProjeto(projeto.tipoProjeto)}</p>
                </div>
                {projeto.tensaoFornecimento && (
                  <div>
                    <label className="text-sm font-medium text-gray-400">
                      Tensao de Fornecimento
                    </label>
                    <p className="text-gray-100">{projeto.tensaoFornecimento}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-400">Servicos</label>
                  <p className="text-gray-100">
                    {projeto.servicos?.length ? projeto.servicos.join(', ') : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informacoes Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Enquadramento</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.enquadramento || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Protecao CC</label>
                  <p className="text-gray-100">{projeto.dadosProjeto.protecaoCC || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Valor</label>
                  <p className="text-gray-100">{formatCurrency(projeto.valor)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Data de Abertura</label>
                  <p className="text-gray-100">{formatDate(projeto.dataAbertura)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Projeto Fast Track</label>
                  <p className="text-gray-100">{formatBinaryChoice(projeto.projetoFastTrack)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Projeto Novo</label>
                  <p className="text-gray-100">{formatBinaryChoice(projeto.projetoNovo)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">
                    Zero Grid / Controle de Exportacao
                  </label>
                  <p className="text-gray-100">
                    {formatBinaryChoice(projeto.zeroGridControleExportacao)}
                  </p>
                </div>
                {projeto.tipoProjeto === 'fotovoltaico' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Potencia total dos Modulos
                      </label>
                      <p className="text-gray-100">{potenciaTotalModulos} W</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Potencia total dos Inversores
                      </label>
                      <p className="text-gray-100">{potenciaTotalInversores} W</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Potencia total do Sistema
                      </label>
                      <p className="text-gray-100">{potenciaTotalSistema} W</p>
                    </div>
                  </>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-400">Observacoes</label>
                  <p className="text-gray-100 whitespace-pre-wrap">{projeto.observacoes || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Data de Criacao</label>
                  <p className="text-gray-100">{formatDate(projeto.dataCriacao)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Ultima Atualizacao</label>
                  <p className="text-gray-100">{formatDate(projeto.dataAtualizacao)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tecnicos' && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Tecnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h4 className="text-lg font-semibold text-gray-100">Resumo Eletrico</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Tensao (V)
                    </label>
                    <p className="mt-2 text-2xl font-semibold text-gray-100">
                      {projeto.dadosTecnicos.tensao || 0}V
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Numero de Fases
                    </label>
                    <p className="mt-2 text-2xl font-semibold text-gray-100">
                      {projeto.dadosTecnicos.numeroFases || '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Tipo de Ramal
                    </label>
                    <p className="mt-2 text-lg font-semibold text-gray-100">
                      {projeto.dadosTecnicos.ramal || '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Disjuntor
                    </label>
                    <p className="mt-2 text-lg font-semibold text-gray-100">
                      {projeto.dadosTecnicos.disjuntor || '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Carga Instalada
                    </label>
                    <p className="mt-2 text-2xl font-semibold text-gray-100">
                      {projeto.dadosTecnicos.cargaInstalada.toLocaleString('pt-BR')} W
                    </p>
                  </div>
                  {projeto.tensaoFornecimento && (
                    <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                        Tensao de Fornecimento
                      </label>
                      <p className="mt-2 text-lg font-semibold text-gray-100">
                        {projeto.tensaoFornecimento}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {projeto.padraoEntradaItens && projeto.padraoEntradaItens.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                  <h4 className="text-lg font-semibold text-gray-100">
                    Quadro de Padrao de Entrada
                  </h4>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Tipo de Ligacao
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Classificacao
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Disjuntor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {projeto.padraoEntradaItens.map((item) => (
                          <tr key={item.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {item.tipoLigacao}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {item.classificacao}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {item.quantidade}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {item.disjuntor || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h4 className="text-lg font-semibold text-gray-100">Modulos</h4>
                {projeto.dadosTecnicos.modulos.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-900/30 px-4 py-5 text-gray-400">
                    Nenhum modulo cadastrado.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Fabricante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Modelo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Potencia (W)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Potencia Total (kWp)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {projeto.dadosTecnicos.modulos.map((modulo) => (
                          <tr key={modulo.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {modulo.fabricante}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {modulo.modelo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {modulo.potencia}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {modulo.quantidade}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {modulo.potenciaPico}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h4 className="text-lg font-semibold text-gray-100">Inversores</h4>
                {projeto.dadosTecnicos.inversores.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-900/30 px-4 py-5 text-gray-400">
                    Nenhum inversor cadastrado.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Fabricante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Modelo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Potencia (W)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Potencia Total (kW)
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {projeto.dadosTecnicos.inversores.map((inversor) => (
                          <tr key={inversor.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {inversor.fabricante}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {inversor.modelo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {inversor.potencia}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {inversor.quantidade}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {inversor.potenciaTotal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h4 className="text-lg font-semibold text-gray-100">Divisao de Creditos</h4>
                {projeto.dadosTecnicos.divisaoCreditos.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-900/30 px-4 py-5 text-gray-400">
                    Nenhuma divisao de creditos cadastrada.
                  </div>
                ) : (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Percentual
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            UC
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Classe
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Endereco
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {projeto.dadosTecnicos.divisaoCreditos.map((credito, index) => (
                          <tr key={`${credito.uc}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                              {credito.percentual}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {credito.uc}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {credito.classe}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {credito.endereco}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle>Linha do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              {projeto.timeline.length === 0 ? (
                <p className="text-gray-400">Nenhum evento na linha do tempo.</p>
              ) : (
                <div className="space-y-6 page-enter">
                  {projeto.timeline.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/25 p-4"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">{getTimelineIcon(item.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-lg font-medium text-gray-100">{item.etapa}</h4>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openTimelineDialog(item, 'add')}
                                >
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Adicionar comentario
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openTimelineDialog(item, 'view')}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver comentarios ({item.comentarios?.length ?? 0})
                                </Button>
                              </div>
                            </div>
                            <span className="text-sm text-gray-400">{formatDate(item.data)}</span>
                          </div>
                          {item.descricao && (
                            <p className="mt-1 text-sm text-gray-300">{item.descricao}</p>
                          )}
                          {(item.comentarios?.length ?? 0) > 0 && (
                            <div className="mt-3 inline-flex items-center rounded-full border border-white/10 bg-slate-900/40 px-3 py-1 text-xs text-slate-300">
                              <ChatCircleText className="mr-2 h-4 w-4" />
                              {item.comentarios?.length} comentario(s) registrado(s)
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'documentos' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>Documentos</CardTitle>
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
              {clienteDetalhe && clienteDetalhe.documentos.length > 0 && (
                <div className="mb-6 rounded-xl border border-white/10 bg-slate-950/35 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-100">
                        Reaproveitar documentos do cliente
                      </h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {clienteDetalhe.nome} possui {clienteDetalhe.documentos.length} documento(s)
                        disponivel(is).
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
                    {clienteDetalhe.documentos.map((documento) => (
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
              {projeto.documentos.length === 0 ? (
                <p className="text-gray-400">Nenhum documento cadastrado.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Nome
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Data de Upload
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Tamanho
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Acoes
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {projeto.documentos.map((documento) => (
                        <tr key={documento.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2 text-gray-400" />
                              {documento.nome}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {documento.tipo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(documento.dataUpload)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {(documento.tamanho / 1024 / 1024).toFixed(2)} MB
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void handleDownload(documento.fileId)}
                              disabled={!documento.fileId}
                            >
                              Download
                            </Button>
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
      </div>

      {timelineDialogItem && (
        <TimelineCommentsDialog
          item={timelineDialogItem}
          mode={timelineDialogMode}
          commentText={timelineComment}
          saving={savingTimelineComment}
          onCommentTextChange={setTimelineComment}
          onSave={() => void handleSaveTimelineComment()}
          onClose={() => {
            if (savingTimelineComment) return;
            setTimelineDialogItem(null);
            setTimelineComment('');
            setTimelineDialogMode('view');
          }}
        />
      )}
    </div>
  );
};
