import { useEffect, useMemo, useState } from 'react';
import {
  concessionairesService,
  customersService,
  financeiroService,
  projectsService,
  usersService,
} from '@/services';
import type { TransacaoFinanceira } from '@/features/financeiro/services/financeiroService';
import type { Projeto } from '@/types';
import { columns, getStatusLabel, toKanbanStatus, type KanbanStatus } from '../kanban/kanbanConfig';
import { useDragToScroll } from './useDragToScroll';
import { calendarioService } from '@/features/calendario/services/calendarioService';

type PendingStatusChange = {
  projectId: string;
  nextStatus: KanbanStatus;
};

export type ProjetoKanbanCard = Projeto & {
  concessionariaLogo?: string | null;
};

export const calculateExpectedProjectRevenue = (
  projetos: Array<Pick<Projeto, 'id' | 'valor'>>,
  transacoes: Array<Pick<TransacaoFinanceira, 'tipo' | 'valor' | 'projectId'>>,
) => {
  const receivedByProject = new Map<string, number>();
  transacoes.forEach((transacao) => {
    if (transacao.tipo !== 'receita' || !transacao.projectId) return;
    receivedByProject.set(
      transacao.projectId,
      (receivedByProject.get(transacao.projectId) ?? 0) + transacao.valor,
    );
  });

  return projetos.reduce(
    (total, projeto) =>
      total + Math.max((Number(projeto.valor) || 0) - (receivedByProject.get(projeto.id) ?? 0), 0),
    0,
  );
};

const normalizeText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const getProjectIdentifier = (projeto: Pick<Projeto, 'sequence' | 'subsequente' | 'protocolo'>) => {
  if (!projeto.sequence) return projeto.protocolo;
  return projeto.subsequente
    ? `${projeto.sequence}/${projeto.subsequente}`
    : String(projeto.sequence);
};

export const useProjetosKanban = () => {
  const [projetos, setProjetos] = useState<ProjetoKanbanCard[]>([]);
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [userOptions, setUserOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | KanbanStatus>('todos');
  const [userFilter, setUserFilter] = useState('todos');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusStartDate, setStatusStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [statusDurationDays, setStatusDurationDays] = useState(5);
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
        const [data, customers, concessionarias, users, financialEntries] = await Promise.all([
          projectsService.getProjetos(),
          customersService.getAll().catch(() => []),
          concessionairesService.getAll().catch(() => []),
          usersService.getAll().catch(() => []),
          financeiroService.listTransacoes().catch(() => []),
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
        setTransacoes(financialEntries);
        setUserOptions(
          users
            .map((user) => ({ value: user.id, label: user.name.trim() || user.email }))
            .filter((option) => option.value && option.label)
            .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')),
        );
      } catch (loadError) {
        console.error('Erro ao carregar projetos:', loadError);
        setError('Nao foi possivel carregar os projetos.');
      } finally {
        setLoading(false);
      }
    };

    void loadProjetos();
  }, []);

  const projectUserOptions = useMemo(() => {
    const options = new Map<string, string>();

    projetos.forEach((projeto) => {
      const id = projeto.dadosProjeto.integradorId || projeto.dadosProjeto.integrador;
      const label = projeto.dadosProjeto.integrador || projeto.dadosProjeto.integradorId;
      if (!id || !label) return;
      options.set(id, label);
    });

    return Array.from(options, ([value, label]) => ({ value, label })).sort((left, right) =>
      left.label.localeCompare(right.label, 'pt-BR'),
    );
  }, [projetos]);

  const availableUserOptions = useMemo(() => {
    const options = new Map(userOptions.map((option) => [option.value, option.label]));
    projectUserOptions.forEach((option) => {
      if (!options.has(option.value)) {
        options.set(option.value, option.label);
      }
    });

    return Array.from(options, ([value, label]) => ({ value, label })).sort((left, right) =>
      left.label.localeCompare(right.label, 'pt-BR'),
    );
  }, [projectUserOptions, userOptions]);

  const filteredProjetos = useMemo(
    () =>
      projetos.filter((projeto) => {
        const query = normalizeText(searchTerm);
        const statusAtual = toKanbanStatus(projeto.status);
        const matchesStatus = statusFilter === 'todos' || statusAtual === statusFilter;
        if (!matchesStatus) return false;

        const matchesUser =
          userFilter === 'todos' ||
          projeto.dadosProjeto.integradorId === userFilter ||
          projeto.dadosProjeto.integrador === userFilter;
        if (!matchesUser) return false;

        const identifier = getProjectIdentifier(projeto);
        if (!query) return true;

        return (
          normalizeText(identifier).includes(query) ||
          normalizeText(projeto.id).includes(query) ||
          normalizeText(projeto.protocolo).includes(query) ||
          normalizeText(projeto.protocoloConcessionaria).includes(query) ||
          normalizeText(projeto.cliente.nome).includes(query) ||
          normalizeText(projeto.dadosProjeto.concessionaria).includes(query)
        );
      }),
    [projetos, searchTerm, statusFilter, userFilter],
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
    const valor = calculateExpectedProjectRevenue(filteredProjetos, transacoes);
    const abertas = filteredProjetos.filter(
      (item) => !['projeto_encerrado', 'projeto_cancelado'].includes(toKanbanStatus(item.status)),
    ).length;
    const aprovados = filteredProjetos.filter((item) => {
      const status = toKanbanStatus(item.status);
      return status === 'projeto_aprovado' || status === 'projeto_encerrado';
    }).length;

    return { total, valor, abertas, aprovados };
  }, [filteredProjetos, transacoes]);

  const updateProjetoStatus = async (id: string, nextStatus: KanbanStatus, comment: string) => {
    const previous = projetos;
    if (!projetos.find((item) => item.id === id)) return;

    setProjetos((current) =>
      current.map((item) => (item.id === id ? { ...item, status: nextStatus } : item)),
    );

    try {
      setUpdatingStatus(true);
      await projectsService.updateStatus(id, nextStatus, comment.trim() || undefined);
      const project = projetos.find((item) => item.id === id);
      if (project) {
        try {
          await calendarioService.saveStatusDeadline(
            id,
            getProjectIdentifier(project),
            nextStatus,
            getStatusLabel(nextStatus),
            statusStartDate,
            statusDurationDays,
          );
        } catch (calendarError) {
          console.error(
            'Status atualizado, mas o prazo não foi salvo no calendário:',
            calendarError,
          );
          setError('Status atualizado, mas não foi possível salvar o prazo no calendário.');
        }
      }
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
    setStatusStartDate(new Date().toISOString().slice(0, 10));
    setStatusDurationDays(5);
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
    setStatusStartDate(new Date().toISOString().slice(0, 10));
    setStatusDurationDays(5);
  };

  const cancelStatusChange = () => {
    setPendingStatusChange(null);
    setStatusComment('');
  };

  const handleDrop = (columnId: KanbanStatus, event: React.DragEvent<HTMLDivElement>) => {
    const id = event.dataTransfer.getData('text/project-id');
    if (!id) return;
    setDraggedId(null);
    openStatusDialog(id, columnId);
  };

  const handleDragStart = (id: string, event: React.DragEvent<HTMLDivElement>) => {
    setDraggedId(id);
    event.dataTransfer.setData('text/project-id', id);
  };

  const handleProjectUpdated = (updatedProject: ProjetoKanbanCard) => {
    setProjetos((current) =>
      current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
    );
  };

  return {
    loading,
    error,
    searchTerm,
    statusFilter,
    userFilter,
    userOptions: availableUserOptions,
    filteredProjetos,
    groupedProjetos,
    visibleColumns,
    stats,
    draggedId,
    pendingStatusChange,
    statusComment,
    statusStartDate,
    statusDurationDays,
    updatingStatus,
    containerRef,
    isDragging,
    dragBindings,
    setSearchTerm,
    setStatusFilter,
    setUserFilter,
    setStatusComment,
    setStatusStartDate,
    setStatusDurationDays,
    setDraggedId,
    openStatusDialog,
    confirmStatusChange,
    cancelStatusChange,
    handleDrop,
    handleDragStart,
    handleProjectUpdated,
  };
};
