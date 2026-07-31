/** Pagina 'CalendarioPage': renderiza a agenda usando hook e helpers do dominio da feature. */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  Users,
  CaretLeft,
  CaretRight,
  Folder,
  PencilSimple,
  Trash,
  Wrench,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card';
import {
  formatDateBR,
  formatMonthYear,
  getDaysInMonth,
  getOrigemLabel,
  getTipoColor,
  getTipoIcon,
  type FiltroAgenda,
  type TipoEventoManual,
} from '../domain/calendar';
import { useCalendario } from '../hooks/useCalendario';

export const CalendarioPage: React.FC = () => {
  const {
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
  } = useCalendario();
  const today = new Date();
  const defaultFocusDay =
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear()
      ? today.getDate()
      : 1;
  const focusDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDayFilter ?? defaultFocusDay,
  );
  const weekStart = new Date(focusDate);
  weekStart.setDate(focusDate.getDate() - focusDate.getDay());
  const compactViewDates =
    viewMode === 'dia'
      ? [focusDate]
      : Array.from({ length: 7 }, (_, index) => {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + index);
          return date;
        });

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Calendario</h1>
          <p className="text-gray-400 mt-1">
            Agenda com eventos, projetos e serviços do mes atual.
          </p>
          {loadingProjetos && (
            <p className="text-xs text-gray-500 mt-1">Carregando datas dos projetos...</p>
          )}
          {erroProjetos && <p className="text-xs text-red-400 mt-1">{erroProjetos}</p>}
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <select
            value={viewMode}
            onChange={(event) => setViewMode(event.target.value as 'mes' | 'semana' | 'dia')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
          <Button
            onClick={() => {
              if (isFormOpen) {
                setIsFormOpen(false);
                resetNovoEvento();
                return;
              }
              resetNovoEvento();
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-700 text-blue-300 bg-blue-900/40">
              <Folder className="h-4 w-4" /> Projetos
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-green-700 text-green-300 bg-green-900/40">
              <Wrench className="h-4 w-4" /> Serviços
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-orange-700 text-orange-300 bg-orange-900/40">
              <CalendarIcon className="h-4 w-4" /> Eventos
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={filtroAgenda}
                onChange={(event) => setFiltroAgenda(event.target.value as FiltroAgenda)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="todos">Mostrar tudo</option>
                <option value="evento">So eventos</option>
                <option value="projeto">So projetos</option>
                <option value="servico">So serviços</option>
              </select>
              {selectedDayFilter !== null && (
                <Button variant="outline" size="sm" onClick={() => setSelectedDayFilter(null)}>
                  Limpar dia
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar novo evento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvento} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block text-sm text-gray-300 md:col-span-2">
                <span className="mb-1 block">Projeto relacionado (opcional)</span>
                <select
                  value={novoEvento.projectId}
                  onChange={(event) =>
                    setNovoEvento((current) => ({ ...current, projectId: event.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Sem projeto relacionado</option>
                  {projetos.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.sequence
                        ? `ID ${project.sequence}${project.subsequente ? `/${project.subsequente}` : ''}`
                        : project.protocolo}{' '}
                      — {project.cliente.nome}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Titulo"
                placeholder="Ex: Reuniao com cliente"
                value={novoEvento.titulo}
                onChange={(event) =>
                  setNovoEvento((current) => ({ ...current, titulo: event.target.value }))
                }
                required
              />
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block">Tipo</span>
                <select
                  value={novoEvento.tipo}
                  onChange={(event) =>
                    setNovoEvento((current) => ({
                      ...current,
                      tipo: event.target.value as TipoEventoManual,
                    }))
                  }
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="instalacao">Instalacao</option>
                  <option value="manutencao">Manutencao</option>
                  <option value="reuniao">Reuniao</option>
                  <option value="vistoria">Vistoria</option>
                </select>
              </label>
              <Input
                label="Data"
                type="date"
                value={novoEvento.data}
                onChange={(event) =>
                  setNovoEvento((current) => ({ ...current, data: event.target.value }))
                }
                required
              />
              <Input
                label="Hora"
                type="time"
                value={novoEvento.hora}
                onChange={(event) =>
                  setNovoEvento((current) => ({ ...current, hora: event.target.value }))
                }
                required
              />
              <Input
                label="Local"
                placeholder="Endereço"
                value={novoEvento.local}
                onChange={(event) =>
                  setNovoEvento((current) => ({ ...current, local: event.target.value }))
                }
                required
              />
              <Input
                label="Participantes"
                placeholder="Nomes separados por virgula"
                value={novoEvento.participantes}
                onChange={(event) =>
                  setNovoEvento((current) => ({ ...current, participantes: event.target.value }))
                }
              />
              <div className="md:col-span-2">
                <Input
                  label="Descricao"
                  placeholder="Resumo"
                  value={novoEvento.descricao}
                  onChange={(event) =>
                    setNovoEvento((current) => ({ ...current, descricao: event.target.value }))
                  }
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetNovoEvento();
                  }}
                >
                  Cancelar
                </Button>
                {editingEventId && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingEvent}
                    onClick={() => void handleDeleteEvento(editingEventId)}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                )}
                <Button type="submit" loading={savingEvent}>
                  {editingEventId ? 'Salvar alterações' : 'Salvar evento'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {viewMode === 'mes' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" onClick={() => navigateMonth('prev')}>
                <CaretLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-100">
                {formatMonthYear(selectedDate)}
              </h2>
              <Button variant="outline" onClick={() => navigateMonth('next')}>
                <CaretRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
                <div key={day} className="text-center py-2 text-sm font-medium text-gray-400">
                  {day}
                </div>
              ))}

              {getDaysInMonth(selectedDate).map((day, index) => {
                const dayItems = day ? getItensForDay(day) : [];
                const today = new Date();
                const isToday =
                  day === today.getDate() &&
                  selectedDate.getMonth() === today.getMonth() &&
                  selectedDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={String(index)}
                    className={[
                      'min-h-[90px] border border-gray-700 rounded-lg p-2',
                      day ? 'hover:bg-gray-800 cursor-pointer' : '',
                      isToday ? 'bg-blue-900/20 border-blue-600' : '',
                      day && selectedDayFilter === day ? 'ring-2 ring-opj-blue bg-blue-900/30' : '',
                    ].join(' ')}
                    onClick={() => {
                      if (!day) return;
                      setSelectedDayFilter(day);
                    }}
                  >
                    {day && (
                      <>
                        <div
                          className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}
                        >
                          {day}
                        </div>
                        <div className="mt-1 space-y-1">
                          {dayItems.slice(0, 2).map((item) => (
                            <div
                              key={item.id}
                              className={`text-xs px-1 py-0.5 rounded truncate ${getTipoColor(item)}`}
                              title={item.titulo}
                            >
                              {getTipoIcon(item)} {item.titulo}
                            </div>
                          ))}
                          {dayItems.length > 2 && (
                            <div className="text-xs text-gray-400">+{dayItems.length - 2} mais</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode !== 'mes' && (
        <Card>
          <CardHeader>
            <CardTitle>{viewMode === 'dia' ? 'Agenda do dia' : 'Agenda da semana'}</CardTitle>
          </CardHeader>
          <CardContent className={`grid gap-3 ${viewMode === 'semana' ? 'md:grid-cols-7' : ''}`}>
            {compactViewDates.map((date) => {
              const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const items = agendaFiltradaOrdenada.filter((item) => item.data === dateKey);
              return (
                <div
                  key={dateKey}
                  className="rounded-xl border border-white/10 bg-slate-950/35 p-3"
                >
                  <div className="text-sm font-semibold text-slate-200">
                    {date.toLocaleDateString('pt-BR', {
                      weekday: 'short',
                      day: '2-digit',
                      month: '2-digit',
                    })}
                  </div>
                  <div className="mt-3 space-y-2">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openEventForEdit(item)}
                        className={`w-full rounded-lg px-2 py-2 text-left text-xs ${getTipoColor(item)}`}
                      >
                        <div className="font-semibold">
                          {item.hora} · {item.titulo}
                        </div>
                      </button>
                    ))}
                    {items.length === 0 && <div className="text-xs text-slate-500">Sem itens</div>}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDayFilter !== null
              ? `Agenda do dia ${formatDateFromDay(selectedDayFilter)}`
              : 'Proximos Itens da Agenda'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {agendaFiltradaOrdenada.slice(0, selectedDayFilter !== null ? 50 : 8).map((item) => (
              <div key={item.id} className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg">
                <div className={`p-2 rounded-lg ${getTipoColor(item)}`}>
                  <span className="text-xs font-semibold">{getTipoIcon(item)}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-100">{item.titulo}</h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDateBR(item.data)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {item.hora}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {item.local}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {item.participantes.length} participantes
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs border border-gray-600 text-gray-300">
                      {getOrigemLabel(item.origem)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-300">{item.descricao || 'Sem descricao.'}</p>
                </div>
                {item.projectId ? (
                  <Link to={`/projetos/${item.projectId}`}>
                    <Button variant="outline" size="sm">
                      Ver projeto
                    </Button>
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Evento
                  </Button>
                )}
                {item.origem === 'evento' && item.subtipo !== 'status_deadline' && (
                  <Button variant="outline" size="sm" onClick={() => openEventForEdit(item)}>
                    <PencilSimple className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
              </div>
            ))}
            {agendaFiltradaOrdenada.length === 0 && (
              <div className="p-4 bg-gray-800 rounded-lg text-gray-400">
                Nenhum item encontrado para o filtro selecionado.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
