import { useEffect, useMemo, useState } from 'react';
import {
  concessionairesService,
  customersService,
  servicosService,
  usersService,
  type Concessionaire,
  type Customer,
  type User,
} from '@/services';
import type { Servico, StatusServico, TipoServico } from '@/types';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useDragToScroll } from '@/features/projects/hooks/useDragToScroll';

export type ServicoKanbanCard = Servico & {
  concessionariaLogo?: string | null;
  integradorNome?: string;
};

const normalizeText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export const enrichServicosKanban = (
  servicos: Servico[],
  concessionarias: Concessionaire[],
  users: Array<Pick<User, 'id' | 'name'>>,
  sessionUser: { id: string; name: string } | null,
): ServicoKanbanCard[] => {
  const concessionairesById = new Map(concessionarias.map((item) => [item.id, item]));
  const concessionairesByName = new Map(
    concessionarias.map((item) => [normalizeText(item.name), item]),
  );
  const userNamesById = new Map(users.map((user) => [user.id, user.name]));

  if (sessionUser) {
    userNamesById.set(sessionUser.id, sessionUser.name);
  }

  return servicos.map((servico) => {
    const concessionaria =
      (servico.concessionariaId ? concessionairesById.get(servico.concessionariaId) : undefined) ??
      concessionairesByName.get(normalizeText(servico.concessionaria));

    return {
      ...servico,
      concessionariaLogo: concessionaria?.logo ?? null,
      integradorNome:
        servico.integradorNome ||
        (servico.integradorId ? userNamesById.get(servico.integradorId) : undefined) ||
        (servico.createdBy ? userNamesById.get(servico.createdBy) : undefined),
    };
  });
};

export const useServicosKanban = () => {
  const currentUser = useCurrentUser();
  const canManageStatus = currentUser?.isAdmin === true;
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [concessionarias, setConcessionarias] = useState<Concessionaire[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
        const [servicosData, clientesData, concessionariasData, usersData] = await Promise.all([
          servicosService.list(),
          customersService.getAll().catch(() => []),
          concessionairesService.getAll().catch(() => []),
          currentUser?.isAdmin ? usersService.getAll().catch(() => []) : Promise.resolve([]),
        ]);

        setServicos(servicosData);
        setClientes(clientesData);
        setConcessionarias(concessionariasData);
        setUsers(usersData);
      } catch (loadError) {
        console.error('Erro ao carregar serviços:', loadError);
        setError('Não foi possível carregar os serviços.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentUser?.isAdmin]);

  const enrichedServicos = useMemo(
    () => enrichServicosKanban(servicos, concessionarias, users, currentUser),
    [concessionarias, currentUser, servicos, users],
  );

  const filteredServicos = useMemo(
    () =>
      enrichedServicos.filter((servico) => {
        const query = searchTerm.toLowerCase();
        const matchesStatus = statusFilter === 'todos' || servico.status === statusFilter;
        const matchesType = typeFilter === 'todos' || servico.tipo === typeFilter;
        const nome = String(servico.nome ?? '').toLowerCase();
        const cliente = String(servico.cliente ?? '').toLowerCase();
        const protocolo =
          `${servico.protocolo ?? ''}${servico.subsequencia ? `/${servico.subsequencia}` : ''}`.toLowerCase();
        const concessionaria = String(servico.concessionaria ?? '').toLowerCase();
        const integrador = String(servico.integradorNome ?? '').toLowerCase();

        if (!matchesStatus || !matchesType) {
          return false;
        }

        return (
          nome.includes(query) ||
          cliente.includes(query) ||
          protocolo.includes(query) ||
          concessionaria.includes(query) ||
          integrador.includes(query)
        );
      }),
    [enrichedServicos, searchTerm, statusFilter, typeFilter],
  );

  const groupedServicos = useMemo(
    () =>
      servicosService.statusFlow.reduce<Record<StatusServico, ServicoKanbanCard[]>>(
        (acc, column) => {
          acc[column.status] = filteredServicos.filter((item) => item.status === column.status);
          return acc;
        },
        {} as Record<StatusServico, ServicoKanbanCard[]>,
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
      console.error('Erro ao atualizar status do serviço:', updateError);
      setServicos(previous);
      setError('Não foi possível atualizar o status do serviço.');
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
