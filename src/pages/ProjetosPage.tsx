/** Pagina 'ProjetosPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MagnifyingGlass, PlusCircle } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent } from '../components/Card';
import { customersService, projectsService } from '../services';
import type { Projeto } from '../types';

type KanbanStatus =
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

const normalizeStatusKey = (rawStatus: unknown): string =>
  String(rawStatus ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_');

const normalizeModalidade = (value: unknown): 'Geração Compartilhada' | 'Geração Distribuída' => {
  const text = String(value ?? '').toLowerCase();
  return text.includes('compart') ? 'Geração Compartilhada' : 'Geração Distribuída';
};

const normalizeEnquadramento = (value: unknown, potenciaSistema: number): 'Microgeração' | 'Minigeração' => {
  const text = String(value ?? '').toLowerCase();
  if (text.includes('mini')) {
    return 'Minigeração';
  }

  if (text.includes('micro')) {
    return 'Microgeração';
  }

  return potenciaSistema > 75 ? 'Minigeração' : 'Microgeração';
};

const columns: Array<{ id: KanbanStatus; label: string; className: string }> = [
  { id: 'em_analise_documentacao', label: 'Em Análise da Documentação', className: 'border-amber-700/60 bg-amber-900/20' },
  { id: 'elaboracao_documentacao_tecnica', label: 'Elaboração da Documentação Técnica', className: 'border-orange-700/60 bg-orange-900/20' },
  { id: 'aguardando_assinatura_cliente', label: 'Aguardando Assinatura do Cliente', className: 'border-yellow-700/60 bg-yellow-900/20' },
  { id: 'projeto_enviado_aguardando_protocolo_concessionaria', label: 'Projeto Enviado (Aguardando Protocolo Concessionária)', className: 'border-lime-700/60 bg-lime-900/20' },
  { id: 'em_analise_concessionaria', label: 'Em Análise na Concessionária', className: 'border-sky-700/60 bg-sky-900/20' },
  { id: 'ressalvas_projetos', label: 'Ressalvas Projetos', className: 'border-rose-700/60 bg-rose-900/20' },
  { id: 'obras_concessionaria', label: 'Obras da Concessionária', className: 'border-cyan-700/60 bg-cyan-900/20' },
  { id: 'projeto_aprovado', label: 'Projeto Aprovado', className: 'border-emerald-700/60 bg-emerald-900/20' },
  { id: 'vistoria_solicitada', label: 'Vistoria Solicitada', className: 'border-teal-700/60 bg-teal-900/20' },
  { id: 'vistoria_reprovada', label: 'Vistoria Reprovada', className: 'border-red-700/60 bg-red-900/20' },
  { id: 'aguardando_pagamento', label: 'Aguardando Pagamento', className: 'border-violet-700/60 bg-violet-900/20' },
  { id: 'projeto_encerrado', label: 'Projeto Encerrado', className: 'border-emerald-700/60 bg-emerald-900/30' }
];

const kanbanStatusMap: Record<string, KanbanStatus> = {
  em_analise_documentacao: 'em_analise_documentacao',
  elaboracao_documentacao_tecnica: 'elaboracao_documentacao_tecnica',
  aguardando_assinatura_cliente: 'aguardando_assinatura_cliente',
  projeto_enviado_aguardando_protocolo_concessionaria: 'projeto_enviado_aguardando_protocolo_concessionaria',
  em_analise_concessionaria: 'em_analise_concessionaria',
  ressalvas_projetos: 'ressalvas_projetos',
  obras_concessionaria: 'obras_concessionaria',
  projeto_aprovado: 'projeto_aprovado',
  vistoria_solicitada: 'vistoria_solicitada',
  vistoria_reprovada: 'vistoria_reprovada',
  aguardando_pagamento: 'aguardando_pagamento',
  projeto_encerrado: 'projeto_encerrado',
  // Compatibilidade com status antigos.
  pendente: 'em_analise_documentacao',
  novo: 'em_analise_documentacao',
  em_andamento: 'em_analise_concessionaria',
  em_analise: 'em_analise_concessionaria',
  aguardando_aprovacao: 'aguardando_assinatura_cliente',
  instalacao: 'obras_concessionaria',
  aprovado: 'projeto_aprovado',
  concluido: 'projeto_encerrado',
  cancelado: 'projeto_encerrado'
};

const toKanbanStatus = (status: Projeto['status']): KanbanStatus => {
  const normalized = normalizeStatusKey(status);
  return kanbanStatusMap[normalized] ?? 'em_analise_documentacao';
};

const toApiProjectStatus = (status: KanbanStatus): string => {
  return columns.find((column) => column.id === status)?.label ?? 'Em Análise da Documentação';
};

export const ProjetosPage: React.FC = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | KanbanStatus>('todos');
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const loadProjetos = async () => {
      setLoading(true);
      setError(null);

      try {
        const [data, customers] = await Promise.all([
          projectsService.getProjetos(),
          customersService.getAll().catch(() => [])
        ]);

        const customersById = new Map(customers.map((customer) => [customer.id, customer]));
        const enriched = data.map((projeto) => {
          const knownCustomer = customersById.get(projeto.cliente.id);
          if (!knownCustomer) {
            return projeto;
          }

          const shouldReplaceName = !projeto.cliente.nome || projeto.cliente.nome === 'Cliente sem nome';
          if (!shouldReplaceName) {
            return projeto;
          }

          return {
            ...projeto,
            cliente: {
              ...projeto.cliente,
              nome: knownCustomer.nome,
              cpfCnpj: projeto.cliente.cpfCnpj || knownCustomer.cpfCnpj,
              telefone: projeto.cliente.telefone || knownCustomer.telefone,
              email: projeto.cliente.email || knownCustomer.email
            }
          };
        });

        setProjetos(enriched);
      } catch (loadError) {
        console.error('Erro ao carregar projetos:', loadError);
        setError('Nao foi possivel carregar os projetos.');
      } finally {
        setLoading(false);
      }
    };

    void loadProjetos();
  }, []);

  const filteredProjetos = useMemo(
    () =>
      projetos.filter((projeto) => {
        const query = searchTerm.toLowerCase();
        const statusAtual = toKanbanStatus(projeto.status);
        const matchesStatus = statusFilter === 'todos' || statusAtual === statusFilter;

        if (!matchesStatus) {
          return false;
        }

        return (
          projeto.protocolo.toLowerCase().includes(query) ||
          projeto.cliente.nome.toLowerCase().includes(query) ||
          projeto.dadosProjeto.concessionaria.toLowerCase().includes(query)
        );
      }),
    [projetos, searchTerm, statusFilter]
  );

  const groupedProjetos = useMemo(
    () => {
      const grouped = columns.reduce<Record<KanbanStatus, Projeto[]>>((acc, column) => {
        acc[column.id] = [];
        return acc;
      }, {} as Record<KanbanStatus, Projeto[]>);
      filteredProjetos.forEach((item) => {
        grouped[toKanbanStatus(item.status)].push(item);
      });
      return grouped;
    },
    [filteredProjetos]
  );

  const visibleColumns = useMemo(
    () => (statusFilter === 'todos' ? columns : columns.filter((column) => column.id === statusFilter)),
    [statusFilter]
  );

  const updateProjetoStatus = async (id: string, nextStatus: KanbanStatus) => {
    const previous = projetos;
    const projetoAtual = projetos.find((item) => item.id === id);
    if (!projetoAtual) {
      return;
    }

    const statusApi = toApiProjectStatus(nextStatus);

    setProjetos((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus
            }
          : item
      )
    );

    try {
      const rawProjeto = await projectsService.getByIdRaw(id);
      const potenciaFromRaw =
        typeof rawProjeto.potenciaSistema === 'number'
          ? rawProjeto.potenciaSistema
          : Number(projetoAtual.dadosProjeto.potenciaSistema || 0);
      const valorFromRaw =
        typeof rawProjeto.valor === 'number'
          ? rawProjeto.valor
          : Number(projetoAtual.valor || 0);
      const modalidade = normalizeModalidade(rawProjeto.modalidade);
      const enquadramento = normalizeEnquadramento(rawProjeto.enquadramento, potenciaFromRaw);

      // Mantem exatamente o contrato validado no Postman.
      const payloadCompleto: Record<string, unknown> = {
        id: rawProjeto.id ?? projetoAtual.id,
        clienteId: rawProjeto.clienteId ?? projetoAtual.cliente.id,
        concessionaria: rawProjeto.concessionaria ?? projetoAtual.dadosProjeto.concessionaria,
        protocoloConcessionaria: rawProjeto.protocoloConcessionaria ?? projetoAtual.protocolo,
        classe: rawProjeto.classe ?? projetoAtual.dadosProjeto.classe ?? 'Residencial',
        integrator: rawProjeto.integrator ?? projetoAtual.dadosProjeto.integrador,
        modalidade,
        enquadramento,
        protecaoCC: rawProjeto.protecaoCC ?? projetoAtual.dadosProjeto.protecaoCC ?? 'Disjuntor CC 20A',
        potenciaSistema: Number.isFinite(potenciaFromRaw) ? potenciaFromRaw : 0,
        valor: Number.isFinite(valorFromRaw) ? valorFromRaw : 0,
        status: statusApi
      };
      await projectsService.update(id, payloadCompleto);
    } catch (updateError) {
      console.error('Erro ao atualizar status do projeto:', updateError);
      if (updateError instanceof Error && 'payload' in updateError) {
        console.error('Payload de erro retornado pela API:', (updateError as { payload?: unknown }).payload);
      }
      console.error('Status enviado para update:', statusApi);
      setProjetos(previous);
      setError('Nao foi possivel atualizar o status do projeto.');
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Projetos</h1>
          <p className="mt-1 text-gray-400">Kanban com 12 status aceitos para projetos.</p>
        </div>
        <Link to="/projetos/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
            <Input
              placeholder="Buscar por protocolo, cliente ou concessionaria..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              icon={<MagnifyingGlass />}
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'todos' | KanbanStatus)}
              className="h-[46px] w-full rounded-xl border border-white/20 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35"
            >
              <option value="todos">Todos os status</option>
              {columns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
        {visibleColumns.map((column) => (
          <Card key={column.id} className={`w-[340px] shrink-0 border ${column.className}`}>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{column.label}</h2>
                <span className="rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-slate-300">
                  {groupedProjetos[column.id].length}
                </span>
              </div>

              <div
                className="space-y-3"
                onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: React.DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData('text/project-id');
                  if (!id) {
                    return;
                  }

                  setDraggedId(null);
                  void updateProjetoStatus(id, column.id);
                }}
              >
                {groupedProjetos[column.id].map((projeto) => (
                  <div
                    key={projeto.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedId(projeto.id);
                      event.dataTransfer.setData('text/project-id', projeto.id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className={`cursor-grab rounded-xl border border-white/10 bg-slate-900/80 p-4 transition hover:border-cyan-300/40 hover:bg-slate-800/80 ${
                      draggedId === projeto.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="mb-2 text-sm font-semibold text-slate-100">{projeto.protocolo}</div>
                    <div className="text-sm text-slate-300">{projeto.cliente.nome}</div>
                    <div className="mt-1 text-xs text-slate-400">{projeto.dadosProjeto.concessionaria}</div>
                    <div className="mt-1 text-xs text-slate-400">{projeto.dadosProjeto.potenciaSistema} kWp</div>

                    <div className="mt-3 flex items-center gap-2">
                      <select
                        value={toKanbanStatus(projeto.status)}
                        onChange={(event) => {
                          void updateProjetoStatus(projeto.id, event.target.value as KanbanStatus);
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950/70 px-2 py-1 text-xs text-slate-200"
                      >
                        {columns.map((columnOption) => (
                          <option key={columnOption.id} value={columnOption.id}>
                            {columnOption.label}
                          </option>
                        ))}
                      </select>

                      <Link to={`/projetos/${projeto.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
                          Abrir
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {groupedProjetos[column.id].length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-slate-400">
                    Nenhum projeto nesta coluna.
                  </div>
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
