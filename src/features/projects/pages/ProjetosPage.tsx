import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrencyBRL } from '@/core/utils/masks';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { concessionairesService, customersService, projectsService } from '@/services';
import type { Projeto } from '@/types';
import { columns, toKanbanStatus, type KanbanStatus } from '../kanban/kanbanConfig';
import { ProjetosPageHeader } from '../components/ProjectPageHeader';
import { ProjetosFilter } from '../components/ProjectFilter';
import { KanbanColumn } from '../components/KanbanColumn';
import { StatusChangeDialog } from '../components/StatusChangeDialog';
import { useDragToScroll } from '../hooks/useDragToScroll';

type PendingStatusChange = {
  projectId: string;
  nextStatus: KanbanStatus;
};

export type ProjetoKanbanCard = Projeto & {
  concessionariaLogo?: string | null;
};

const normalizeText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const ProjetosPage: React.FC = () => {
  const [projetos, setProjetos] = useState<ProjetoKanbanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | KanbanStatus>('todos');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const { containerRef, isDragging, dragBindings } = useDragToScroll({
    canStartDrag: (event) =>
      !(
        event.target instanceof HTMLElement && event.target.closest('[data-no-drag-scroll="true"]')
      ),
  });

  useEffect(() => {
    const loadProjetos = async () => {
      setLoading(true);
      setError(null);

      try {
        const [data, customers, concessionarias] = await Promise.all([
          projectsService.getProjetos(),
          customersService.getAll().catch(() => []),
          concessionairesService.getAll().catch(() => []),
        ]);

        const customersById = new Map(customers.map((customer) => [customer.id, customer]));
        const concessionariasByName = new Map<string, (typeof concessionarias)[number]>();

        concessionarias.forEach((item) => {
          concessionariasByName.set(normalizeText(item.name), item);
          if (item.acronym) {
            concessionariasByName.set(normalizeText(item.acronym), item);
          }
        });

        const enriched = data.map((projeto) => {
          const knownCustomer = customersById.get(projeto.cliente.id);
          const concessionaria = concessionariasByName.get(
            normalizeText(projeto.dadosProjeto.concessionaria),
          );
          const projetoComLogo: ProjetoKanbanCard = {
            ...projeto,
            concessionariaLogo: concessionaria?.logo ?? null,
          };

          if (!knownCustomer) return projetoComLogo;

          const shouldReplaceName =
            !projeto.cliente.nome || projeto.cliente.nome === 'Cliente sem nome';
          if (!shouldReplaceName) return projetoComLogo;

          return {
            ...projetoComLogo,
            cliente: {
              ...projeto.cliente,
              nome: knownCustomer.nome,
              cpfCnpj: projeto.cliente.cpfCnpj || knownCustomer.cpfCnpj,
              telefone: projeto.cliente.telefone || knownCustomer.telefone,
              email: projeto.cliente.email || knownCustomer.email,
            },
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
        if (!matchesStatus) return false;

        return (
          projeto.protocolo.toLowerCase().includes(query) ||
          projeto.cliente.nome.toLowerCase().includes(query) ||
          projeto.dadosProjeto.concessionaria.toLowerCase().includes(query)
        );
      }),
    [projetos, searchTerm, statusFilter],
  );

  const groupedProjetos = useMemo(() => {
    const grouped = columns.reduce<Record<KanbanStatus, ProjetoKanbanCard[]>>(
      (acc, column) => {
        acc[column.id] = [];
        return acc;
      },
      {} as Record<KanbanStatus, ProjetoKanbanCard[]>,
    );
    filteredProjetos.forEach((item) => grouped[toKanbanStatus(item.status)].push(item));
    return grouped;
  }, [filteredProjetos]);

  const visibleColumns = useMemo(
    () =>
      statusFilter === 'todos' ? columns : columns.filter((column) => column.id === statusFilter),
    [statusFilter],
  );

  const stats = useMemo(() => {
    const total = filteredProjetos.length;
    const valor = filteredProjetos.reduce((acc, item) => acc + (Number(item.valor) || 0), 0);
    const abertas = filteredProjetos.filter(
      (item) => toKanbanStatus(item.status) !== 'projeto_encerrado',
    ).length;
    const aprovados = filteredProjetos.filter((item) => {
      const status = toKanbanStatus(item.status);
      return status === 'projeto_aprovado' || status === 'projeto_encerrado';
    }).length;

    return { total, valor, abertas, aprovados };
  }, [filteredProjetos]);

  const updateProjetoStatus = async (id: string, nextStatus: KanbanStatus, comment: string) => {
    const previous = projetos;
    if (!projetos.find((item) => item.id === id)) return;

    setProjetos((current) =>
      current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)),
    );

    try {
      setUpdatingStatus(true);
      await projectsService.updateStatus(id, nextStatus, comment.trim() || undefined);
    } catch (updateError) {
      console.error('Erro ao atualizar status do projeto:', updateError);
      setProjetos(previous);
      setError('Nao foi possivel atualizar o status do projeto.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openStatusDialog = (projectId: string, nextStatus: KanbanStatus) => {
    const projeto = projetos.find((item) => item.id === projectId);
    if (!projeto || toKanbanStatus(projeto.status) === nextStatus) return;

    setError(null);
    setStatusComment('');
    setPendingStatusChange({ projectId, nextStatus });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatusChange) return;
    await updateProjetoStatus(
      pendingStatusChange.projectId,
      pendingStatusChange.nextStatus,
      statusComment,
    );
    setPendingStatusChange(null);
    setStatusComment('');
  };

  const handleDrop = (columnId: KanbanStatus, event: React.DragEvent<HTMLDivElement>) => {
    const id = event.dataTransfer.getData('text/project-id');
    if (!id) return;
    setDraggedId(null);
    openStatusDialog(id, columnId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      <ProjetosPageHeader />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Projetos</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Em aberto</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{stats.abertas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aprovados</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{stats.aprovados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Receita prevista
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {formatCurrencyBRL(stats.valor)}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjetosFilter
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      {error && <ErrorAlert message={error} />}

      <Card padding="none">
        <CardHeader className="mb-0 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Pipeline de Projetos</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Arraste lateralmente para navegar pelas colunas do kanban.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
              {filteredProjetos.length} projeto(s)
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <div
            ref={containerRef}
            className={[
              'hide-scrollbar overflow-x-auto pb-2',
              'touch-pan-y select-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
            ].join(' ')}
            {...dragBindings}
          >
            <div className="flex min-w-max snap-x snap-mandatory gap-4">
              {visibleColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  projetos={groupedProjetos[column.id]}
                  draggedId={draggedId}
                  onDragStart={(id, event) => {
                    setDraggedId(id);
                    event.dataTransfer.setData('text/project-id', id);
                  }}
                  onDragEnd={() => setDraggedId(null)}
                  onDrop={handleDrop}
                  onStatusChange={openStatusDialog}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingStatusChange && (
        <StatusChangeDialog
          pendingStatusChange={pendingStatusChange}
          statusComment={statusComment}
          updatingStatus={updatingStatus}
          onCommentChange={setStatusComment}
          onConfirm={() => void confirmStatusChange()}
          onCancel={() => {
            setPendingStatusChange(null);
            setStatusComment('');
          }}
        />
      )}
    </div>
  );
};
