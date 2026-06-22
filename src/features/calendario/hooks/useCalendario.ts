import { useEffect, useMemo, useState } from 'react';
import { projectsService, servicosService } from '@/services';
import type { Projeto, Servico } from '@/types';
import {
  buildAgendaItems,
  createEmptyEventoForm,
  CURRENT_MONTH,
  CURRENT_YEAR,
  formatDateBR,
  type AgendaItem,
  type EventoManual,
  type FiltroAgenda,
} from '../domain/calendar';

export const useCalendario = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(false);
  const [erroProjetos, setErroProjetos] = useState<string | null>(null);
  const [eventosManuais, setEventosManuais] = useState<EventoManual[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1));
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [filtroAgenda, setFiltroAgenda] = useState<FiltroAgenda>('todos');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novoEvento, setNovoEvento] = useState(createEmptyEventoForm());

  useEffect(() => {
    const loadAgenda = async () => {
      setLoadingProjetos(true);
      try {
        const [projectsData, servicesData] = await Promise.all([
          projectsService.getProjetos(),
          servicosService.list(),
        ]);
        setProjetos(projectsData);
        setServicos(servicesData);
        setErroProjetos(null);
      } catch (error) {
        console.error('Erro ao carregar agenda para o calendario:', error);
        setErroProjetos('Nao foi possivel carregar projetos e serviços.');
      } finally {
        setLoadingProjetos(false);
      }
    };

    void loadAgenda();
  }, []);

  const agendaItems = useMemo<AgendaItem[]>(
    () => buildAgendaItems(eventosManuais, projetos, servicos),
    [eventosManuais, projetos, servicos],
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const nextDate = new Date(selectedDate);
    if (direction === 'prev') nextDate.setMonth(nextDate.getMonth() - 1);
    else nextDate.setMonth(nextDate.getMonth() + 1);
    setSelectedDate(nextDate);
  };

  const getItensForDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return agendaItems.filter(
      (item) => item.data === dateStr && (filtroAgenda === 'todos' || item.origem === filtroAgenda),
    );
  };

  const formatDateFromDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formatDateBR(dateStr);
  };

  const resetNovoEvento = () => {
    setNovoEvento(createEmptyEventoForm());
  };

  const handleCreateEvento = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !novoEvento.titulo.trim() ||
      !novoEvento.data ||
      !novoEvento.hora ||
      !novoEvento.local.trim()
    ) {
      return;
    }

    const participantes = novoEvento.participantes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const novoRegistro: EventoManual = {
      id: `e-${Date.now()}`,
      titulo: novoEvento.titulo.trim(),
      tipo: novoEvento.tipo,
      data: novoEvento.data,
      hora: novoEvento.hora,
      local: novoEvento.local.trim(),
      participantes,
      descricao: novoEvento.descricao.trim(),
    };

    setEventosManuais((current) => [novoRegistro, ...current]);
    resetNovoEvento();
    setIsFormOpen(false);
  };

  const agendaFiltradaOrdenada = useMemo(
    () =>
      [...agendaItems]
        .filter((item) => filtroAgenda === 'todos' || item.origem === filtroAgenda)
        .filter((item) => {
          if (selectedDayFilter === null) return true;
          const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayFilter).padStart(2, '0')}`;
          return item.data === dateStr;
        })
        .sort(
          (left, right) =>
            new Date(`${left.data}T${left.hora}`).getTime() -
            new Date(`${right.data}T${right.hora}`).getTime(),
        ),
    [agendaItems, filtroAgenda, selectedDate, selectedDayFilter],
  );

  return {
    loadingProjetos,
    erroProjetos,
    selectedDate,
    viewMode,
    filtroAgenda,
    selectedDayFilter,
    isFormOpen,
    novoEvento,
    agendaFiltradaOrdenada,
    setViewMode,
    setFiltroAgenda,
    setSelectedDayFilter,
    setIsFormOpen,
    setNovoEvento,
    navigateMonth,
    getItensForDay,
    formatDateFromDay,
    resetNovoEvento,
    handleCreateEvento,
  };
};
