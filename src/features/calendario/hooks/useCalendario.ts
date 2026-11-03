import { useEffect, useMemo, useRef, useState } from 'react';
import { projectsService, servicosService } from '@/services';
import type { Projeto, Servico } from '@/types';
import {
  buildAgendaItems,
  createEmptyEventoForm,
  CURRENT_MONTH,
  CURRENT_YEAR,
  formatDateBR,
  filterAgendaPeriod,
  getAgendaRange,
  localDateKey,
  type AgendaItem,
  type EventoManual,
  type FiltroAgenda,
} from '../domain/calendar';
import { calendarioService, type CalendarEvent } from '../services/calendarioService';

const calendarEventToManual = (event: CalendarEvent): EventoManual => ({
  id: event.id,
  projectId: event.project_id ?? undefined,
  serviceId: event.content.service_id,
  status: event.content.status,
  updatedAt: event.updated_at,
  titulo: event.content.title || 'Evento',
  tipo: event.content.type || 'reuniao',
  data: event.date,
  hora: event.content.time || '09:00',
  local: event.content.location || 'Local não informado',
  participantes: event.content.participants || [],
  descricao: event.content.description || '',
});

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
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [novoEvento, setNovoEvento] = useState(createEmptyEventoForm());
  const revision = useRef(0);
  const { from, to } = getAgendaRange(selectedDate, viewMode, selectedDayFilter);

  useEffect(() => {
    let disposed = false;
    let running = false;
    const loadAgenda = async () => {
      if (running || disposed) return;
      running = true;
      const requestRevision = revision.current;
      setLoadingProjetos(true);
      try {
        const [projectsData, servicesData, events] = await Promise.all([
          projectsService.getProjetos({ forceRefresh: true, includeProjectAddresses: false }),
          servicosService.list({ forceRefresh: true, includeAddresses: false }),
          // Read all persisted events so an old deadline cannot reappear when
          // the newest deadline for that entity was moved to another month.
          calendarioService.list(),
        ]);
        if (disposed || requestRevision !== revision.current) return;
        setProjetos(projectsData);
        setServicos(servicesData);
        setEventosManuais(events.map(calendarEventToManual));
        setErroProjetos(null);
      } catch (error) {
        console.error('Erro ao carregar agenda para o calendario:', error);
        if (!disposed) setErroProjetos('Não foi possível atualizar os dados do calendário.');
      } finally {
        running = false;
        if (!disposed) setLoadingProjetos(false);
      }
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadAgenda();
    };
    void loadAgenda();
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const timer = window.setInterval(refreshWhenVisible, 60_000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [from, to]);

  const agendaItems = useMemo<AgendaItem[]>(
    () => buildAgendaItems(eventosManuais, projetos, servicos),
    [eventosManuais, projetos, servicos],
  );

  const navigateMonth = (direction: 'prev' | 'next') => {
    const nextDate = new Date(selectedDate);
    if (direction === 'prev') nextDate.setMonth(nextDate.getMonth() - 1);
    else nextDate.setMonth(nextDate.getMonth() + 1);
    setSelectedDayFilter(null);
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
    setEditingEventId(null);
  };

  const openEventForEdit = (item: AgendaItem) => {
    if (item.origem !== 'evento' || item.subtipo === 'status_deadline') return;
    const event = eventosManuais.find((current) => current.id === item.id);
    if (!event) return;

    setEditingEventId(event.id);
    setNovoEvento({
      projectId: event.projectId || '',
      titulo: event.titulo,
      tipo: event.tipo,
      data: event.data,
      hora: event.hora,
      local: event.local === 'Local não informado' ? '' : event.local,
      participantes: event.participantes.join(', '),
      descricao: event.descricao,
    });
    setIsFormOpen(true);
  };

  const handleCreateEvento = async (event: React.FormEvent<HTMLFormElement>) => {
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

    setSavingEvent(true);
    try {
      const payload = {
        project_id: novoEvento.projectId || null,
        date: novoEvento.data,
        content: {
          title: novoEvento.titulo.trim(),
          type: novoEvento.tipo,
          time: novoEvento.hora,
          location: novoEvento.local.trim(),
          participants: participantes,
          description: novoEvento.descricao.trim(),
        },
      };
      const saved = editingEventId
        ? await calendarioService.update(editingEventId, payload)
        : await calendarioService.create(payload);
      revision.current += 1;
      const normalized = calendarEventToManual(saved);
      setEventosManuais((current) =>
        editingEventId
          ? current.map((item) => (item.id === editingEventId ? normalized : item))
          : [normalized, ...current],
      );
      resetNovoEvento();
      setIsFormOpen(false);
      setErroProjetos(null);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      setErroProjetos(error instanceof Error ? error.message : 'Não foi possível salvar o evento.');
    } finally {
      setSavingEvent(false);
    }
  };

  const handleDeleteEvento = async (eventId: string) => {
    setSavingEvent(true);
    try {
      await calendarioService.remove(eventId);
      revision.current += 1;
      setEventosManuais((current) => current.filter((item) => item.id !== eventId));
      if (editingEventId === eventId) {
        resetNovoEvento();
        setIsFormOpen(false);
      }
      setErroProjetos(null);
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      setErroProjetos(
        error instanceof Error ? error.message : 'Não foi possível excluir o evento.',
      );
    } finally {
      setSavingEvent(false);
    }
  };

  const agendaFiltradaOrdenada = useMemo(
    () => filterAgendaPeriod(agendaItems, { from, to }, filtroAgenda),
    [agendaItems, filtroAgenda, from, to],
  );
  const today = localDateKey(new Date());
  const selectedDay =
    selectedDayFilter === null
      ? null
      : localDateKey(
          new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDayFilter),
        );
  const agendaLista = useMemo(
    () =>
      agendaFiltradaOrdenada.filter((item) => {
        if (viewMode !== 'mes') return true;
        return selectedDay ? item.data === selectedDay : item.data >= today;
      }),
    [agendaFiltradaOrdenada, viewMode, selectedDay, today],
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
    projetos,
    editingEventId,
    savingEvent,
    agendaFiltradaOrdenada,
    agendaLista,
    setViewMode,
    setFiltroAgenda,
    setSelectedDayFilter,
    setIsFormOpen,
    setNovoEvento,
    navigateMonth,
    getItensForDay,
    formatDateFromDay,
    resetNovoEvento,
    openEventForEdit,
    handleCreateEvento,
    handleDeleteEvento,
  };
};
