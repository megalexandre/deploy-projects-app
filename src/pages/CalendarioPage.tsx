import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: 'instalacao' | 'manutencao' | 'reuniao' | 'vistoria';
  local: string;
  participantes: string[];
  descricao: string;
}

export const CalendarioPage: React.FC = () => {
  const [eventos] = useState<Evento[]>([
    {
      id: '1',
      titulo: 'Instalação Sistema Solar',
      data: '2024-01-20',
      hora: '09:00',
      tipo: 'instalacao',
      local: 'Rua das Flores, 123 - São Paulo',
      participantes: ['João Silva', 'Pedro Santos'],
      descricao: 'Instalação de 10 painéis solares residenciais'
    },
    {
      id: '2',
      titulo: 'Manutenção Preventiva',
      data: '2024-01-22',
      hora: '14:00',
      tipo: 'manutencao',
      local: 'Av. Principal, 456 - Campinas',
      participantes: ['Carlos Oliveira'],
      descricao: 'Manutenção trimestral do sistema'
    },
    {
      id: '3',
      titulo: 'Reunião com Cliente',
      data: '2024-01-25',
      hora: '10:00',
      tipo: 'reuniao',
      local: 'Escritório OPJ',
      participantes: ['Maria Santos', 'João Silva', 'Pedro Santos'],
      descricao: 'Apresentação de proposta comercial'
    }
  ]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'mes' | 'semana' | 'dia'>('mes');

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'instalacao':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'manutencao':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      case 'reuniao':
        return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'vistoria':
        return 'bg-green-900/50 text-green-300 border-green-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'instalacao':
        return '🔧';
      case 'manutencao':
        return '🔨';
      case 'reuniao':
        return '👥';
      case 'vistoria':
        return '📋';
      default:
        return '📅';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const getEventosForDay = (day: number) => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return eventos.filter(evento => evento.data === dateStr);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Calendário</h1>
          <p className="text-gray-400 mt-1">Agendamento de atividades da OPJ Engenharia</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'mes' | 'semana' | 'dia')}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
          >
            <option value="dia">Dia</option>
            <option value="semana">Semana</option>
            <option value="mes">Mês</option>
          </select>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Calendar Navigation */}
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

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Week days */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
              <div key={day} className="text-center py-2 text-sm font-medium text-gray-400">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {getDaysInMonth(selectedDate).map((day, index) => {
              const dayEvents = day ? getEventosForDay(day) : [];
              const isToday = day === new Date().getDate() && 
                            selectedDate.getMonth() === new Date().getMonth() && 
                            selectedDate.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={index}
                  className={`
                    min-h-[80px] border border-gray-700 rounded-lg p-2
                    ${day ? 'hover:bg-gray-800 cursor-pointer' : ''}
                    ${isToday ? 'bg-blue-900/20 border-blue-600' : ''}
                  `}
                >
                  {day && (
                    <>
                      <div className={`text-sm font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
                        {day}
                      </div>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((evento) => (
                          <div
                            key={evento.id}
                            className={`text-xs px-1 py-0.5 rounded truncate ${getTipoColor(evento.tipo)}`}
                            title={evento.titulo}
                          >
                            {getTipoIcon(evento.tipo)} {evento.titulo}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{dayEvents.length - 2} mais
                          </div>
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

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventos
              .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
              .slice(0, 5)
              .map((evento) => (
                <div key={evento.id} className="flex items-start space-x-4 p-4 bg-gray-800 rounded-lg">
                  <div className={`p-2 rounded-lg ${getTipoColor(evento.tipo)}`}>
                    <span className="text-lg">{getTipoIcon(evento.tipo)}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-100">{evento.titulo}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1" />
                        {evento.data}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {evento.hora}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {evento.local}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {evento.participantes.length} participantes
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-gray-300">{evento.descricao}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Detalhes
                  </Button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

