import type { Projeto } from '@/types';

export type KanbanStatus =
  | 'em_analise_documentacao'
  | 'elaboracao_documentacao_tecnica'
  | 'aguardando_assinatura_cliente'
  | 'projeto_enviado_aguardando_protocolo_concessionaria'
  | 'em_analise_concessionaria'
  | 'ressalvas_projetos'
  | 'obras_concessionaria'
  | 'projeto_aprovado'
  | 'vistoria_solicitada'
  | 'vistoria_reprovada'
  | 'aguardando_pagamento'
  | 'projeto_encerrado';

const legacyStatusMap: Record<string, KanbanStatus> = {
  aguardando_aprovacao: 'em_analise_documentacao',
  pendente: 'em_analise_documentacao',
  novo: 'em_analise_documentacao',
  em_andamento: 'em_analise_concessionaria',
  em_analise: 'em_analise_concessionaria',
  instalacao: 'obras_concessionaria',
  aprovado: 'projeto_aprovado',
  concluido: 'projeto_encerrado',
  cancelado: 'projeto_encerrado',
};

export const columns: Array<{ id: KanbanStatus; label: string; className: string }> = [
  {
    id: 'em_analise_documentacao',
    label: 'Em Análise da Documentação',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'elaboracao_documentacao_tecnica',
    label: 'Elaboração da Documentação Técnica',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'aguardando_assinatura_cliente',
    label: 'Aguardando Assinatura do Cliente',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'projeto_enviado_aguardando_protocolo_concessionaria',
    label: 'Projeto Enviado (Aguardando Protocolo Concessionária)',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'em_analise_concessionaria',
    label: 'Em Análise na Concessionária',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'ressalvas_projetos',
    label: 'Ressalvas Projetos',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'obras_concessionaria',
    label: 'Obras da Concessionária',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'projeto_aprovado',
    label: 'Projeto Aprovado',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'vistoria_solicitada',
    label: 'Vistoria Solicitada',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'vistoria_reprovada',
    label: 'Vistoria Reprovada',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'aguardando_pagamento',
    label: 'Aguardando Pagamento',
    className: 'border-white/10 bg-sky-900/20',
  },
  {
    id: 'projeto_encerrado',
    label: 'Projeto Encerrado',
    className: 'border-white/10 bg-sky-900/20',
  },
];

const normalizeStatusKey = (rawStatus: unknown): string =>
  String(rawStatus ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[\s-]+/g, '_');

export const toKanbanStatus = (status: Projeto['status']): KanbanStatus => {
  const normalized = normalizeStatusKey(status);
  const column = columns.find((c) => c.id === normalized);
  return column?.id ?? legacyStatusMap[normalized] ?? 'em_analise_documentacao';
};

export const getStatusLabel = (status: KanbanStatus): string =>
  columns.find((column) => column.id === status)?.label ?? status;
