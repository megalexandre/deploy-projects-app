/** Pagina 'ProjetoDetailPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChatCircleText,
  Check,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  PencilSimple,
  PlusCircle,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { customersService, filesService, projectsService, type Customer } from '@/services';
import type { Documento, Projeto } from '@/types';
import { maskCpfOrCnpj, maskPhoneBR, onlyDigits } from '@/core/utils/masks';
import { EntityFinanceTab } from '@/features/financeiro/components/EntityFinanceTab';
import { TimelineCommentsDialog } from '../components/TimelineCommentsDialog';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';

const mergeDocuments = (current: Documento[], incoming: Documento[]) => {
  const merged = new Map<string, Documento>();

  [...current, ...incoming].forEach((documento) => {
    merged.set(documento.fileId || documento.id, documento);
  });

  return Array.from(merged.values());
};

const publicAssetUrl = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;

type EditableFieldOption = {
  label: string;
  value: string;
};

const EditableProjectField: React.FC<{
  label: string;
  value: string;
  displayValue?: React.ReactNode;
  canEdit: boolean;
  type?: 'text' | 'number' | 'date' | 'textarea' | 'select';
  options?: EditableFieldOption[];
  onSave: (value: string) => Promise<void>;
}> = ({ label, value, displayValue, canEdit, type = 'text', options = [], onSave }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!editing) {
      setDraft(value);
    }
  }, [editing, value]);

  const cancel = () => {
    setDraft(value);
    setError('');
    setEditing(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');

    try {
      await onSave(draft);
      setEditing(false);
    } catch (saveError) {
      console.error(`Erro ao atualizar ${label}:`, saveError);
      setError('Nao foi possivel salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-400">{label}</label>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md p-1 text-gray-500 transition hover:bg-white/10 hover:text-cyan-300"
            aria-label={`Editar ${label}`}
            title={`Editar ${label}`}
          >
            <PencilSimple className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="mt-1 flex items-start gap-2">
          {type === 'textarea' ? (
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-cyan-300/50 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          ) : type === 'select' ? (
            <select
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-cyan-300/50 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 rounded-xl border border-cyan-300/50 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            />
          )}
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="rounded-lg border border-cyan-300/40 p-2 text-cyan-300 transition hover:bg-cyan-300/10 disabled:opacity-50"
            aria-label={`Salvar ${label}`}
            title="Salvar"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={cancel}
            disabled={saving}
            className="rounded-lg border border-white/15 p-2 text-gray-400 transition hover:bg-white/10 hover:text-gray-200 disabled:opacity-50"
            aria-label={`Cancelar edicao de ${label}`}
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className="text-gray-100">{displayValue ?? (value || '-')}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

const procuracaoTemplates: Record<
  string,
  { buttonLabel: string; title: string; grantee: string; validityDays: number; powers: string }
> = {
  fotovoltaico: {
    buttonLabel: 'Gerar procuracao Solar',
    title: 'INSTRUMENTO PARTICULAR DE PROCURAÇÃO PARA PROJETOS FOTOVOLTAICOS',
    grantee:
      'OPJ Engenharia, com sede na Rua Pelotas, 256, Centro, Campina das Missões, RS, CEP: 98975-000, inscrita no CNPJ: 40.888.978/0001-56, neste ato representada pelo ENG. ORLEI PETRY JUNIOR, brasileiro, solteiro, empresário, portador do CPF 028.141.010-05, RG n° 1092760741 expedido por SSP/DI RS, registro geral CREA n° RS260827, residente e domiciliado em Rua Pelotas, 256, Centro, Campina das Missões, RS, Telefone (51) 99783-6992, E-mail orlei@opjengenharia.com',
    validityDays: 180,
    powers:
      'Atuar junto à concessionária de energia elétrica, podendo solicitar orçamento de conexão para mini ou microgeração distribuída, dar entrada em consulta de acesso, solicitar parecer de acesso, aumento de carga, adequação do ramal de entrada, protocolar, acompanhar e responder exigências técnicas, assinar documentos, cadastros, projetos e demais formulários necessários, bem como representar o(a) OUTORGANTE perante a Ouvidoria da concessionária e junto à Agência Nacional de Energia Elétrica (ANEEL), podendo registrar, acompanhar e responder reclamações, manifestações, recursos administrativos e demais procedimentos relacionados ao objeto deste mandato, praticando, ainda, todos os atos necessários ao fiel cumprimento deste instrumento, inclusive dar vistas e assinar documentos, como se o(a) OUTORGANTE pessoalmente os praticasse.',
  },
  padrao_entrada: {
    buttonLabel: 'Gerar procuracao EMUC',
    title:
      'INSTRUMENTO PARTICULAR DE PROCURAÇÃO PARA PROJETOS DE EMPREENDIMENTOS DE MÚLTIPLAS UNIDADES CONSUMIDORAS (EMUC)',
    grantee:
      'OPJ Engenharia, com sede na Rua Pelotas, 256, Centro, Campina das Missões, RS, CEP 98975-000, inscrita no CNPJ: 40.888.978/0001-56, registrada no CREA-RS n° 271024, neste ato representada pelo ENG. ORLEI PETRY JUNIOR, brasileiro, solteiro, empresário, portador do CPF 028.141.010-05, registro geral CREA n° RS260827, residente e domiciliado em Rua Pelotas, 256, Centro, Campina das Missões, RS, Telefone (51) 99783-6992, E-mail orlei@opjengenharia.com',
    validityDays: 365,
    powers:
      'Representar o(a) OUTORGANTE perante a concessionária de energia elétrica, sua Ouvidoria, a Agência Nacional de Energia Elétrica (ANEEL) e demais órgãos competentes, com poderes para protocolar, acompanhar e praticar todos os atos necessários à elaboração, análise, aprovação e conclusão de processos relativos a Empreendimentos de Múltiplas Unidades Consumidoras (EMUC), incluindo solicitação de orçamento e parecer de conexão, consulta de acesso, aumento de carga, adequação de ramal de entrada, apresentação, assinatura e retificação de projetos e documentos, cadastramentos, recursos, manifestações e reclamações administrativas, bem como assinar requerimentos, declarações e demais documentos, solicitar vistas, prestar esclarecimentos e adotar todas as providências necessárias ao fiel cumprimento deste mandato, como se o(a) OUTORGANTE pessoalmente praticasse tais atos.',
  },
};

const normalizeTipoProjeto = (
  projeto?: Partial<
    Pick<Projeto, 'tipoProjeto' | 'dadosProjeto' | 'modulos' | 'inversores' | 'padraoEntradaItens'>
  > | null,
) => {
  const tipo = (projeto?.tipoProjeto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (
    ['fotovoltaico', 'projeto_fotovoltaico', 'solar', 'projeto_solar', 'energia_solar'].includes(
      tipo,
    )
  ) {
    return 'fotovoltaico';
  }

  if (['padrao_entrada', 'padrao de entrada', 'emuc', 'projeto_emuc'].includes(tipo)) {
    return 'padrao_entrada';
  }

  if (['orcamento_conexao', 'orcamento de conexao', 'orçamento de conexão'].includes(tipo)) {
    return 'orcamento_conexao';
  }

  if (
    (projeto?.modulos?.length ?? 0) > 0 ||
    (projeto?.inversores?.length ?? 0) > 0 ||
    (projeto?.dadosProjeto?.potenciaSistema ?? 0) > 0
  ) {
    return 'fotovoltaico';
  }

  if ((projeto?.padraoEntradaItens?.length ?? 0) > 0) {
    return 'padrao_entrada';
  }

  return '';
};

const getProcuracaoTemplate = (projeto?: Projeto | null) =>
  procuracaoTemplates[normalizeTipoProjeto(projeto)];

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatEnderecoCompleto = (endereco?: Projeto['endereco']) =>
  [
    endereco?.logradouro,
    endereco?.numero ? `, ${endereco.numero}` : '',
    endereco?.complemento ? ` - ${endereco.complemento}` : '',
    endereco?.bairro ? `, ${endereco.bairro}` : '',
    endereco?.cidade ? `, ${endereco.cidade}` : '',
    endereco?.estado ? `/${endereco.estado}` : '',
  ]
    .join('')
    .trim();

const buildProcuracaoHtml = (
  projeto: Projeto,
  clienteDetalhe: Customer | null,
  template: (typeof procuracaoTemplates)[string],
) => {
  const documento = onlyDigits(projeto.cliente.cpfCnpj);
  const tipoDocumento = documento.length > 11 ? 'CNPJ' : 'CPF';
  const enderecoCliente = clienteDetalhe?.endereco ?? projeto.cliente.endereco ?? projeto.endereco;
  const nomeCliente = projeto.cliente.nome || 'NOME DO CLIENTE';
  const documentoCliente = maskCpfOrCnpj(projeto.cliente.cpfCnpj) || 'CPF/CNPJ';
  const enderecoCompleto = formatEnderecoCompleto(enderecoCliente) || 'ENDEREÇO COMPLETO';
  const cep = enderecoCliente?.cep || 'CEP';
  const qualificacao =
    tipoDocumento === 'CNPJ'
      ? `com sede na ${enderecoCompleto}, CEP: ${cep}.`
      : `residente e domiciliado na ${enderecoCompleto}, CEP: ${cep}.`;
  const timbradoUrl = publicAssetUrl('timbrado.png');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Procuração - ${escapeHtml(nomeCliente)}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #e5e7eb; font-family: Arial, Helvetica, sans-serif; color: #111827; }
    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 39mm 24mm 28mm;
      background: #fff url("${timbradoUrl}") center / cover no-repeat;
    }
    .content { position: relative; z-index: 1; font-size: 11.8pt; line-height: 1.34; }
    h1 { margin: 0 0 11mm; text-align: center; font-size: 13.5pt; line-height: 1.25; font-weight: 700; }
    p { margin: 0 0 5mm; text-align: justify; }
    strong { font-weight: 700; }
    .signature-place { margin-top: 8mm; text-align: left; }
    .signature { margin-top: 17mm; text-align: center; }
    .signature-line { width: 76mm; margin: 0 auto 2mm; border-top: 1px solid #111827; }
    .signature p { margin: 0; text-align: center; line-height: 1.35; }
    @media print {
      body { background: #fff; }
      .page { margin: 0; box-shadow: none; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="content">
      <h1>${escapeHtml(template.title)}</h1>
      <p><strong>OUTORGANTE:</strong> ${escapeHtml(nomeCliente)}, inscrito no ${tipoDocumento} n° ${escapeHtml(documentoCliente)}, ${escapeHtml(qualificacao)}</p>
      <p><strong>OUTORGADO:</strong> ${escapeHtml(template.grantee)}</p>
      <p><strong>PODERES:</strong> ${escapeHtml(template.powers)}</p>
      <p>Esta procuração é válida por ${template.validityDays} dias contado a partir de sua assinatura.</p>
      <p class="signature-place">________________________________, _____ de _____________ de _____.</p>
      <div class="signature">
        <div class="signature-line"></div>
        <p>Outorgante: ${escapeHtml(nomeCliente)}</p>
        <p>${tipoDocumento}: ${escapeHtml(documentoCliente)}</p>
      </div>
    </section>
  </main>
  <script>
    window.addEventListener('load', () => {
      setTimeout(() => window.print(), 300);
    });
  </script>
</body>
</html>`;
};

export const ProjetoDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const currentUser = useCurrentUser();
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

  const handleCreateProcuracao = () => {
    if (!projeto) {
      return;
    }

    const template = getProcuracaoTemplate(projeto);

    if (!template) {
      return;
    }

    const popup = window.open('', '_blank');

    if (!popup) {
      return;
    }

    popup.document.open();
    popup.document.write(buildProcuracaoHtml(projeto, clienteDetalhe, template));
    popup.document.close();
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
    const tipoNormalizado = normalizeTipoProjeto({ tipoProjeto });

    if (tipoNormalizado === 'fotovoltaico') {
      return 'Projeto Solar';
    }

    if (tipoNormalizado === 'padrao_entrada') {
      return 'Projeto EMUC';
    }

    if (tipoNormalizado === 'orcamento_conexao') {
      return 'Orçamento de Conexão';
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
  const tipoProjetoNormalizado = normalizeTipoProjeto(projeto);
  const procuracaoTemplate = getProcuracaoTemplate(projeto);

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
    { id: 'financeiro', label: 'Financeiro' },
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
      const updatedProject = await projectsService.addTimelineComment(
        projeto.id,
        timelineDialogItem.id,
        texto,
      );

      setProjeto(updatedProject);
      setTimelineDialogItem(
        updatedProject.timeline.find((item) => item.id === timelineDialogItem.id) ?? null,
      );
      setTimelineComment('');
      setTimelineDialogMode('view');
    } catch (error) {
      console.error('Erro ao salvar comentario do status do projeto:', error);
    } finally {
      setSavingTimelineComment(false);
    }
  };

  const handleUpdateField = async (projectData: Record<string, unknown>) => {
    if (!projeto) return;

    await projectsService.update(projeto.id, projectData);
    setProjeto(await projectsService.getById(projeto.id));
  };

  const parseNumber = (value: string) => {
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      throw new Error('Valor numerico invalido.');
    }
    return parsed;
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
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(projeto.status)}`}
          >
            {getStatusText(projeto.status)}
          </span>
        </div>
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
                <CardTitle>Informações do Cliente</CardTitle>
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
                <CardTitle>Endereço</CardTitle>
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
                <EditableProjectField
                  label="Protocolo da Concessionaria"
                  value={projeto.protocolo}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ utilityProtocol: value.trim() })}
                />
                <EditableProjectField
                  label="Concessionaria"
                  value={projeto.dadosProjeto.concessionaria}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ utilityCompany: value.trim() })}
                />
                <EditableProjectField
                  label="Classe"
                  value={projeto.dadosProjeto.classe}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ customerClass: value.trim() })}
                />
                <EditableProjectField
                  label="Integrador"
                  value={projeto.dadosProjeto.integrador}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ integrator: value.trim() })}
                />
                <EditableProjectField
                  label="Modalidade"
                  value={projeto.dadosProjeto.modalidade}
                  displayValue={formatModalidade(projeto.dadosProjeto.modalidade)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="select"
                  options={[
                    { value: 'autoconsumo_local', label: 'Autoconsumo Local' },
                    { value: 'autoconsumo_remoto', label: 'Autoconsumo Remoto' },
                    { value: 'geracao_compartilhada', label: 'Geracao Compartilhada' },
                  ]}
                  onSave={(value) => handleUpdateField({ modality: value })}
                />
                <EditableProjectField
                  label="Potencia do Sistema"
                  value={String(projeto.dadosProjeto.potenciaSistema)}
                  displayValue={`${projeto.dadosProjeto.potenciaSistema} kWp`}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="number"
                  onSave={(value) => handleUpdateField({ systemPower: parseNumber(value) })}
                />
                <EditableProjectField
                  label="Numero da UC"
                  value={projeto.numeroUc ?? ''}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ unitControl: value.trim() })}
                />
                <EditableProjectField
                  label="Tipo de Projeto"
                  value={tipoProjetoNormalizado}
                  displayValue={formatTipoProjeto(projeto.tipoProjeto)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="select"
                  options={[
                    { value: 'fotovoltaico', label: 'Projeto Solar' },
                    { value: 'padrao_entrada', label: 'Projeto EMUC' },
                    { value: 'orcamento_conexao', label: 'Orcamento de Conexao' },
                  ]}
                  onSave={(value) => handleUpdateField({ projectType: value })}
                />
                <EditableProjectField
                  label="Tensao de Fornecimento"
                  value={projeto.tensaoFornecimento ?? ''}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="select"
                  options={[
                    { value: '', label: 'Nao informado' },
                    { value: '127/220V', label: '127/220V' },
                    { value: '380/220V', label: '380/220V' },
                  ]}
                  onSave={(value) => handleUpdateField({ tensaoFornecimento: value })}
                />
                <EditableProjectField
                  label="Servicos"
                  value={projeto.servicos?.join(', ') ?? ''}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) =>
                    handleUpdateField({
                      servicesNames: value
                        .split(',')
                        .map((service) => service.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informações Adicionais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EditableProjectField
                  label="Enquadramento"
                  value={projeto.dadosProjeto.enquadramento}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ framework: value.trim() })}
                />
                <EditableProjectField
                  label="Protecao CC"
                  value={projeto.dadosProjeto.protecaoCC}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  onSave={(value) => handleUpdateField({ dcProtection: value.trim() })}
                />
                <EditableProjectField
                  label="Valor"
                  value={String(projeto.valor)}
                  displayValue={formatCurrency(projeto.valor)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="number"
                  onSave={(value) => handleUpdateField({ amount: parseNumber(value) })}
                />
                <EditableProjectField
                  label="Data de Abertura"
                  value={projeto.dataAbertura ?? ''}
                  displayValue={formatDate(projeto.dataAbertura)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="date"
                  onSave={(value) => handleUpdateField({ dataAbertura: value })}
                />
                <EditableProjectField
                  label="Projeto Fast Track"
                  value={projeto.projetoFastTrack ?? 'nao'}
                  displayValue={formatBinaryChoice(projeto.projetoFastTrack)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="select"
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Nao' },
                  ]}
                  onSave={(value) => handleUpdateField({ fastTrack: value })}
                />
                <EditableProjectField
                  label="Projeto Novo"
                  value={projeto.projetoNovo ?? 'sim'}
                  displayValue={formatBinaryChoice(projeto.projetoNovo)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="select"
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao_ampliacao', label: 'Nao, Ampliacao' },
                  ]}
                  onSave={(value) => handleUpdateField({ projetoNovo: value })}
                />
                <EditableProjectField
                  label="Zero Grid / Controle de Exportacao"
                  value={projeto.zeroGridControleExportacao ?? 'nao'}
                  displayValue={formatBinaryChoice(projeto.zeroGridControleExportacao)}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="select"
                  options={[
                    { value: 'sim', label: 'Sim' },
                    { value: 'nao', label: 'Nao' },
                  ]}
                  onSave={(value) => handleUpdateField({ zeroGridControleExportacao: value })}
                />
                {tipoProjetoNormalizado === 'fotovoltaico' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Potência total dos Modulos
                      </label>
                      <p className="text-gray-100">{potenciaTotalModulos} W</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Potência total dos Inversores
                      </label>
                      <p className="text-gray-100">{potenciaTotalInversores} W</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-400">
                        Potência total do Sistema
                      </label>
                      <p className="text-gray-100">{potenciaTotalSistema} W</p>
                    </div>
                  </>
                )}
                <EditableProjectField
                  label="Observacoes"
                  value={projeto.observacoes ?? ''}
                  canEdit={Boolean(currentUser?.isAdmin)}
                  type="textarea"
                  onSave={(value) => handleUpdateField({ description: value.trim() })}
                />
                <div>
                  <label className="text-sm font-medium text-gray-400">Data de Criação</label>
                  <p className="text-gray-100">{formatDate(projeto.dataCriacao)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Última Atualização</label>
                  <p className="text-gray-100">{formatDate(projeto.dataAtualizacao)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tecnicos' && (
          <Card>
            <CardHeader>
              <CardTitle>Dados Técnicos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 p-5">
                <h4 className="text-lg font-semibold text-gray-100">Resumo Elétrico</h4>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Tensão (V)
                    </label>
                    <p className="mt-2 text-2xl font-semibold text-gray-100">
                      {projeto.dadosTecnicos.tensao || 0}V
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-900/55 p-4">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
                      Número de Fases
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
                    Quadro de Padrão de Entrada
                  </h4>
                  <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-slate-900/40">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Tipo de Ligação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                            Classificação
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
                            Potência (W)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Potência Total (kWp)
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
                            Potência (W)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Potência Total (kW)
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
                <h4 className="text-lg font-semibold text-gray-100">Divisão de Creditos</h4>
                {projeto.dadosTecnicos.divisaoCreditos.length === 0 ? (
                  <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-900/30 px-4 py-5 text-gray-400">
                    Nenhuma divisão de creditos cadastrada.
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
                            Endereço
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

        {activeTab === 'financeiro' && (
          <EntityFinanceTab
            entityType="projeto"
            entityId={projeto.id}
            entityLabel={projeto.protocolo}
            amount={projeto.valor}
            createdAt={projeto.dataCriacao}
          />
        )}

        {activeTab === 'documentos' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle>Documentos</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {procuracaoTemplate && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCreateProcuracao}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {procuracaoTemplate.buttonLabel}
                    </Button>
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
                          Ações
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
