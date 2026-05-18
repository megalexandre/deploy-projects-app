import React, { useEffect, useMemo, useState } from 'react';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { customersService, projectsService } from '@/services';
import type { Projeto } from '@/types';
import { columns, toKanbanStatus, type KanbanStatus } from '../kanban/kanbanConfig';
import { ProjetosPageHeader } from '../components/ProjectPageHeader';
import { ProjetosFilter } from '../components/ProjectFilter';
import { KanbanColumn } from '../components/KanbanColumn';
import { StatusChangeDialog } from '../components/StatusChangeDialog';

type PendingStatusChange = {
  projectId: string;
  nextStatus: KanbanStatus;
};

export const ProjetosPage: React.FC = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | KanbanStatus>('todos');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadProjetos = async () => {
      setLoading(true);
      setError(null);

      try {
        const [data, customers] = await Promise.all([
          projectsService.getProjetos(),
          customersService.getAll().catch(() => []),
        ]);

        const customersById = new Map(customers.map((customer) => [customer.id, customer]));
        const enriched = data.map((projeto) => {
          const knownCustomer = customersById.get(projeto.cliente.id);
          if (!knownCustomer) return projeto;

          const shouldReplaceName =
            !projeto.cliente.nome || projeto.cliente.nome === 'Cliente sem nome';
          if (!shouldReplaceName) return projeto;

          return {
            ...projeto,
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
    const grouped = columns.reduce<Record<KanbanStatus, Projeto[]>>(
      (acc, column) => {
        acc[column.id] = [];
        return acc;
      },
      {} as Record<KanbanStatus, Projeto[]>,
    );
    filteredProjetos.forEach((item) => grouped[toKanbanStatus(item.status)].push(item));
    return grouped;
  }, [filteredProjetos]);

  const visibleColumns = useMemo(
    () =>
      statusFilter === 'todos' ? columns : columns.filter((column) => column.id === statusFilter),
    [statusFilter],
  );

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

      <ProjetosFilter
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      {error && <ErrorAlert message={error} />}

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
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
