import { useEffect, useMemo, useState } from 'react';
import {
  concessionairesService,
  customersService,
  servicosService,
  type Concessionaire,
  type Customer,
} from '@/services';
import type { Servico, StatusServico, TipoServico } from '@/types';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useDragToScroll } from '@/features/projects/hooks/useDragToScroll';

export const useServicosKanban = () => {
  const currentUser = useCurrentUser();
  const canManageStatus = currentUser?.isAdmin === true;
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [concessionarias, setConcessionarias] = useState<Concessionaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | StatusServico>('todos');
  const [typeFilter, setTypeFilter] = useState<'todos' | TipoServico>('todos');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const { containerRef, isDragging, dragBindings } = useDragToScroll({
    canStartDrag: (event) =>
      !(
        event.target instanceof HTMLElement && event.target.closest('[data-no-drag-scroll="true"]')
      ),
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [servicosData, clientesData, concessionariasData] = await Promise.all([
          servicosService.list(),
          customersService.getAll().catch(() => []),
          concessionairesService.getAll().catch(() => []),
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
    [searchTerm, servicos, statusFilter, typeFilter],
  );

  const groupedServicos = useMemo(
    () =>
      servicosService.statusFlow.reduce<Record<StatusServico, Servico[]>>(
        (acc, column) => {
          acc[column.status] = filteredServicos.filter((item) => item.status === column.status);
          return acc;
        },
        {} as Record<StatusServico, Servico[]>,
      ),
    [filteredServicos],
  );

  const visibleStatusColumns = useMemo(
    () =>
      statusFilter === 'todos'
        ? servicosService.statusFlow
        : servicosService.statusFlow.filter((column) => column.status === statusFilter),
    [statusFilter],
  );

  const stats = useMemo(() => {
    const total = filteredServicos.length;
    const valor = filteredServicos.reduce((acc, item) => acc + item.valorFinal, 0);
    const abertas = filteredServicos.filter((item) => item.status !== 'servico_encerrado').length;
    const aprovadas = filteredServicos.filter(
      (item) => item.status === 'servico_aprovado' || item.status === 'servico_encerrado',
    ).length;
    return { total, valor, abertas, aprovadas };
  }, [filteredServicos]);

  const updateStatus = async (serviceId: string, nextStatus: StatusServico) => {
    const previous = servicos;
    setServicos((current) =>
      current.map((item) => (item.id === serviceId ? { ...item, status: nextStatus } : item)),
    );

    try {
      const updated = await servicosService.updateStatus(serviceId, nextStatus);
      setServicos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (updateError) {
      console.error('Erro ao atualizar status do servico:', updateError);
      setServicos(previous);
      setError('Nao foi possivel atualizar o status do servico.');
    }
  };

  const handleDragStart = (id: string, event: React.DragEvent<HTMLDivElement>) => {
    setDraggedId(id);
    event.dataTransfer.setData('text/service-id', id);
  };

  const handleDrop = (columnId: StatusServico, event: React.DragEvent<HTMLDivElement>) => {
    const id = event.dataTransfer.getData('text/service-id');
    if (!id) return;
    setDraggedId(null);
    void updateStatus(id, columnId);
  };

  return {
    canManageStatus,
    servicos,
    setServicos,
    clientes,
    concessionarias,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    draggedId,
    setDraggedId,
    filteredServicos,
    groupedServicos,
    visibleStatusColumns,
    stats,
    containerRef,
    isDragging,
    dragBindings,
    updateStatus,
    handleDragStart,
    handleDrop,
  };
};
