import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, CaretLeft, CaretRight, Folder, Wrench } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

type TipoEventoManual = 'instalacao' | 'manutencao' | 'reuniao' | 'vistoria';
type OrigemAgenda = 'evento' | 'projeto' | 'servico';
type FiltroAgenda = 'todos' | OrigemAgenda;

interface EventoManual {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: TipoEventoManual;
  local: string;
  participantes: string[];
  descricao: string;
}

interface ProjetoMock {
  id: string;
  protocolo: string;
  cliente: string;
  data: string;
  hora: string;
  local: string;
  descricao: string;
}

interface ServicoMock {
  id: string;
  nome: string;
  cliente: string;
  data: string;
  hora: string;
  local: string;
  descricao: string;
}

interface AgendaItem {
  id: string;
  origem: OrigemAgenda;
  subtipo?: TipoEventoManual;
  titulo: string;
  data: string;
  hora: string;
  local: string;
  descricao: string;
  participantes: string[];
}

const now = new Date();
const CURRENT_YEAR = now.getFullYear();
const CURRENT_MONTH = now.getMonth() + 1;

const dayToDate = (day: number) => `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const projetosMock: ProjetoMock[] = [
  {
    id: 'p1',
    protocolo: 'PRJ-2401',
    cliente: 'Condominio Vale Verde',
    data: dayToDate(6),
    hora: '10:00',
    local: 'Campinas - SP',
    descricao: 'Entrega de documentacao para aprovacao'
  },
  {
    id: 'p2',
    protocolo: 'PRJ-2407',
    cliente: 'Mercado Nova Era',
    data: dayToDate(13),
    hora: '14:30',
    local: 'Sorocaba - SP',
    descricao: 'Inicio da fase de instalacao dos modulos'
  },
  {
    id: 'p3',
    protocolo: 'PRJ-2415',
    cliente: 'Carlos Santos',
    data: dayToDate(21),
    hora: '09:00',
    local: 'Jundiai - SP',
    descricao: 'Vistoria tecnica final do projeto'
  }
];

const servicosMock: ServicoMock[] = [
  {
    id: 's1',
    nome: 'Manutencao preventiva',
    cliente: 'Residencial das Flores',
    data: dayToDate(8),
    hora: '08:30',
    local: 'Sao Paulo - SP',
    descricao: 'Inspecao e limpeza do arranjo fotovoltaico'
  },
  {
    id: 's2',
    nome: 'Visita tecnica',
    cliente: 'Padaria Bom Dia',
    data: dayToDate(16),
    hora: '11:00',
    local: 'Indaiatuba - SP',
    descricao: 'Levantamento para ampliacao do sistema'
  },
  {
    id: 's3',
    nome: 'Correcao de inversor',
    cliente: 'Escola Horizonte',
    data: dayToDate(24),
    hora: '15:30',
    local: 'Americana - SP',
    descricao: 'Troca de componente e teste de performance'
  }
];

export const CalendarioPage: React.FC = () => {
  const [eventosManuais, setEventosManuais] = useState<EventoManual[]>([
    {
      id: 'e1',
      titulo: 'Reuniao interna de planejamento',
      data: dayToDate(5),
      hora: '09:30',
      tipo: 'reuniao',
      local: 'Escritorio OPJ',
      participantes: ['Operacoes', 'Engenharia'],
      descricao: 'Ajuste de cronograma semanal'
    },
    {
      id: 'e2',
      titulo: 'Vistoria de seguranca',
      data: dayToDate(19),
      hora: '13:00',
      tipo: 'vistoria',
      local: 'Galpao de materiais',
      participantes: ['Tecnico responsavel'],
      descricao: 'Checklist de seguranca da equipe'
    }
  ]);

  const [selectedDate, setSelectedDate] = useState(new Date(CURRENT_YEAR, CURRENT_MONTH - 1, 1));
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');
  const [filtroAgenda, setFiltroAgenda] = useState<FiltroAgenda>('todos');
  const [selectedDayFilter, setSelectedDayFilter] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novoEvento, setNovoEvento] = useState({
    titulo: '',
    tipo: 'instalacao' as TipoEventoManual,
    data: dayToDate(now.getDate()),
    hora: '09:00',
    local: '',
    participantes: '',
    descricao: ''
  });

  const agendaItems = useMemo<AgendaItem[]>(() => {
    const eventos = eventosManuais.map((item) => ({
      id: item.id,
      origem: 'evento' as const,
      subtipo: item.tipo,
      titulo: item.titulo,
      data: item.data,
      hora: item.hora,
      local: item.local,
      descricao: item.descricao,
      participantes: item.participantes
    }));

    const projetos = projetosMock.map((item) => ({
      id: item.id,
      origem: 'projeto' as const,
      titulo: `Projeto ${item.protocolo} - ${item.cliente}`,
      data: item.data,
      hora: item.hora,
      local: item.local,
      descricao: item.descricao,
      participantes: ['Equipe de Projetos']
    }));

    const servicos = servicosMock.map((item) => ({
      id: item.id,
      origem: 'servico' as const,
      titulo: `${item.nome} - ${item.cliente}`,
      data: item.data,
      hora: item.hora,
      local: item.local,
      descricao: item.descricao,
      participantes: ['Equipe de Campo']
    }));

    return [...eventos, ...projetos, ...servicos];
  }, [eventosManuais]);

  const getTipoColor = (item: AgendaItem) => {
    if (item.origem === 'projeto') return 'bg-blue-900/50 text-blue-300 border-blue-700';
    if (item.origem === 'servico') return 'bg-green-900/50 text-green-300 border-green-700';
    if (item.subtipo === 'manutencao') return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
    if (item.subtipo === 'reuniao') return 'bg-purple-900/50 text-purple-300 border-purple-700';
    if (item.subtipo === 'vistoria') return 'bg-cyan-900/50 text-cyan-300 border-cyan-700';
    return 'bg-orange-900/50 text-orange-300 border-orange-700';
  };

  const getTipoIcon = (item: AgendaItem) => {
    if (item.origem === 'projeto') return 'PR';
    if (item.origem === 'servico') return 'SV';
    if (item.subtipo === 'manutencao') return 'MN';
    if (item.subtipo === 'reuniao') return 'RE';
    if (item.subtipo === 'vistoria') return 'VS';
    return 'IN';
  };

  const getOrigemLabel = (origem: OrigemAgenda) => {
    if (origem === 'projeto') return 'Projeto';
    if (origem === 'servico') return 'Servico';
    return 'Evento';
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i += 1) days.push(null);
    for (let i = 1; i <= daysInMonth; i += 1) days.push(i);
    return days;
  };

  const formatMonthYear = (date: Date) => date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  const getItensForDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return agendaItems.filter((item) => item.data === dateStr && (filtroAgenda === 'todos' || item.origem === filtroAgenda));
  };

  const formatDateFromDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return formatDateBR(dateStr);
  };

  const resetNovoEvento = () => {
    setNovoEvento({
      titulo: '',
      tipo: 'instalacao',
      data: dayToDate(now.getDate()),
      hora: '09:00',
      local: '',
      participantes: '',
      descricao: ''
    });
  };

  const handleCreateEvento = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!novoEvento.titulo.trim() || !novoEvento.data || !novoEvento.hora || !novoEvento.local.trim()) return;

    const participantes = novoEvento.participantes.split(',').map((item) => item.trim()).filter(Boolean);
    const novoRegistro: EventoManual = {
      id: `e-${Date.now()}`,
      titulo: novoEvento.titulo.trim(),
      tipo: novoEvento.tipo,
      data: novoEvento.data,
      hora: novoEvento.hora,
      local: novoEvento.local.trim(),
      participantes,
      descricao: novoEvento.descricao.trim()
    };

    setEventosManuais((prev) => [novoRegistro, ...prev]);
    resetNovoEvento();
    setIsFormOpen(false);
  };

  const agendaFiltradaOrdenada = [...agendaItems]
    .filter((item) => filtroAgenda === 'todos' || item.origem === filtroAgenda)
    .filter((item) => {
      if (selectedDayFilter === null) return true;
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDayFilter).padStart(2, '0')}`;
      return item.data === dateStr;
    })
    .sort((a, b) => new Date(`${a.data}T${a.hora}`).getTime() - new Date(`${b.data}T${b.hora}`).getTime());

  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Calendario</h1>
          <p className="text-gray-400 mt-1">Agenda com eventos, projetos e servicos do mes atual (mock).</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'mes' | 'semana' | 'dia')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mes</option>
          </select>
          <Button onClick={() => setIsFormOpen((prev) => !prev)}>
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
              <Wrench className="h-4 w-4" /> Servicos
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-orange-700 text-orange-300 bg-orange-900/40">
              <CalendarIcon className="h-4 w-4" /> Eventos
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <select
                value={filtroAgenda}
                onChange={(e) => setFiltroAgenda(e.target.value as FiltroAgenda)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              >
                <option value="todos">Mostrar tudo</option>
                <option value="evento">So eventos</option>
                <option value="projeto">So projetos</option>
                <option value="servico">So servicos</option>
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
              <Input
                label="Titulo"
                placeholder="Ex: Reuniao com cliente"
                value={novoEvento.titulo}
                onChange={(e) => setNovoEvento((prev) => ({ ...prev, titulo: e.target.value }))}
                required
              />
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block">Tipo</span>
                <select
                  value={novoEvento.tipo}
                  onChange={(e) => setNovoEvento((prev) => ({ ...prev, tipo: e.target.value as TipoEventoManual }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="instalacao">Instalacao</option>
                  <option value="manutencao">Manutencao</option>
                  <option value="reuniao">Reuniao</option>
                  <option value="vistoria">Vistoria</option>
                </select>
              </label>
              <Input label="Data" type="date" value={novoEvento.data} onChange={(e) => setNovoEvento((prev) => ({ ...prev, data: e.target.value }))} required />
              <Input label="Hora" type="time" value={novoEvento.hora} onChange={(e) => setNovoEvento((prev) => ({ ...prev, hora: e.target.value }))} required />
              <Input label="Local" placeholder="Endereco" value={novoEvento.local} onChange={(e) => setNovoEvento((prev) => ({ ...prev, local: e.target.value }))} required />
              <Input
                label="Participantes"
                placeholder="Nomes separados por virgula"
                value={novoEvento.participantes}
                onChange={(e) => setNovoEvento((prev) => ({ ...prev, participantes: e.target.value }))}
              />
              <div className="md:col-span-2">
                <Input label="Descricao" placeholder="Resumo" value={novoEvento.descricao} onChange={(e) => setNovoEvento((prev) => ({ ...prev, descricao: e.target.value }))} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setIsFormOpen(false); resetNovoEvento(); }}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar evento</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={() => navigateMonth('prev')}>
              <CaretLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold text-gray-100">{formatMonthYear(selectedDate)}</h2>
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
              const isToday = day === today.getDate() && selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear();

              return (
                <div
                  key={String(index)}
                  className={`
                    min-h-[90px] border border-gray-700 rounded-lg p-2
                    ${day ? 'hover:bg-gray-800 cursor-pointer' : ''}
                    ${isToday ? 'bg-blue-900/20 border-blue-600' : ''}
                    ${day && selectedDayFilter === day ? 'ring-2 ring-opj-blue bg-blue-900/30' : ''}
                  `}
                  onClick={() => {
                    if (!day) return;
                    setSelectedDayFilter(day);
                  }}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>{day}</div>
                      <div className="mt-1 space-y-1">
                        {dayItems.slice(0, 2).map((item) => (
                          <div key={item.id} className={`text-xs px-1 py-0.5 rounded truncate ${getTipoColor(item)}`} title={item.titulo}>
                            {getTipoIcon(item)} {item.titulo}
                          </div>
                        ))}
                        {dayItems.length > 2 && <div className="text-xs text-gray-400">+{dayItems.length - 2} mais</div>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

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
                <Button variant="outline" size="sm">
                  Ver Detalhes
                </Button>
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
