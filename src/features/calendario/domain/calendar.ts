import type { Projeto, Servico } from '@/types';

export type TipoEventoManual =
  | 'instalacao'
  | 'manutencao'
  | 'reuniao'
  | 'vistoria'
  | 'status_deadline';
export type OrigemAgenda = 'evento' | 'projeto' | 'servico';
export type FiltroAgenda = 'todos' | OrigemAgenda;

export interface EventoManual {
  id: string;
  projectId?: string;
  serviceId?: string;
  status?: string;
  updatedAt?: string;
  titulo: string;
  data: string;
  hora: string;
  tipo: TipoEventoManual;
  local: string;
  participantes: string[];
  descricao: string;
}

export interface AgendaItem {
  id: string;
  projectId?: string;
  serviceId?: string;
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
export const CURRENT_YEAR = now.getFullYear();
export const CURRENT_MONTH = now.getMonth() + 1;

export const dayToDate = (day: number) =>
  `${CURRENT_YEAR}-${String(CURRENT_MONTH).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

export const createEmptyEventoForm = () => ({
  projectId: '',
  titulo: '',
  tipo: 'instalacao' as TipoEventoManual,
  data: dayToDate(now.getDate()),
  hora: '09:00',
  local: '',
  participantes: '',
  descricao: '',
});

export const extractDateAndTime = (value: string): { data: string; hora: string } | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const data = parsed.toISOString().slice(0, 10);
  const hasTime = value.includes('T');
  const hora = hasTime ? parsed.toISOString().slice(11, 16) : '09:00';
  return { data, hora };
};

export const getLocalProjeto = (projeto: Projeto) => {
  const cidadeEstado = [projeto.endereco.cidade, projeto.endereco.estado]
    .filter(Boolean)
    .join(' - ');
  if (cidadeEstado) {
    return cidadeEstado;
  }

  if (projeto.endereco.logradouro) {
    return projeto.endereco.logradouro;
  }

  return 'Local não informado';
};

export const getLocalServico = (servico: Servico) => {
  const endereco = servico.enderecoObra ?? servico.enderecoGeradora;
  const cidadeEstado = [endereco?.cidade, endereco?.estado].filter(Boolean).join(' - ');
  if (cidadeEstado) {
    return cidadeEstado;
  }

  if (endereco?.logradouro) {
    return endereco.logradouro;
  }

  return servico.concessionaria || 'Local não informado';
};

export const isTerminalAgendaStatus = (status: string) =>
  ['projeto_encerrado', 'projeto_cancelado', 'servico_encerrado', 'servico_cancelado'].includes(
    status,
  );

export const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const getAgendaRange = (
  date: Date,
  mode: 'mes' | 'semana' | 'dia',
  day: number | null,
  today = new Date(),
) => {
  if (mode === 'mes')
    return {
      from: localDateKey(new Date(date.getFullYear(), date.getMonth(), 1)),
      to: localDateKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
    };
  const focus = new Date(
    date.getFullYear(),
    date.getMonth(),
    day ??
      (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
        ? today.getDate()
        : 1),
  );
  if (mode === 'dia') return { from: localDateKey(focus), to: localDateKey(focus) };
  const start = new Date(focus);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return { from: localDateKey(start), to: localDateKey(end) };
};

export const filterAgendaPeriod = (
  items: AgendaItem[],
  range: { from: string; to: string },
  origin: FiltroAgenda,
) =>
  items
    .filter(
      (item) =>
        item.data >= range.from &&
        item.data <= range.to &&
        (origin === 'todos' || item.origem === origin),
    )
    .sort(
      (left, right) =>
        `${left.data}T${left.hora}`.localeCompare(`${right.data}T${right.hora}`) ||
        left.id.localeCompare(right.id),
    );

export const buildAgendaItems = (
  eventosManuais: EventoManual[],
  projetos: Projeto[],
  servicos: Servico[],
): AgendaItem[] => {
  const projectsById = new Map(projetos.map((project) => [project.id, project]));
  const servicesById = new Map(servicos.map((service) => [service.id, service]));
  const latestDeadline = new Map<string, EventoManual>();
  const key = (event: EventoManual) =>
    event.projectId
      ? `projeto:${event.projectId}`
      : event.serviceId
        ? `servico:${event.serviceId}`
        : '';
  for (const event of eventosManuais) {
    if (event.tipo !== 'status_deadline' || !key(event)) continue;
    const previous = latestDeadline.get(key(event));
    const updated = Date.parse(event.updatedAt ?? '') || 0;
    const previousUpdated = Date.parse(previous?.updatedAt ?? '') || 0;
    if (
      !previous ||
      updated > previousUpdated ||
      (updated === previousUpdated && event.id > previous.id)
    )
      latestDeadline.set(key(event), event);
  }

  // Status histories remain on the entity's timeline, never as appointments.
  return eventosManuais.flatMap<AgendaItem>((event) => {
    let origem: OrigemAgenda = 'evento';
    if (event.tipo === 'status_deadline') {
      if (latestDeadline.get(key(event)) !== event) return [];
      const entity = event.projectId
        ? projectsById.get(event.projectId)
        : servicesById.get(event.serviceId ?? '');
      if (!entity || isTerminalAgendaStatus(entity.status) || event.status !== entity.status)
        return [];
      const lastTransition = Math.max(
        0,
        ...(entity.timeline ?? []).map((item) => Date.parse(item.data) || 0),
      );
      // A return to the same status must not resurrect a deadline from an older visit.
      if (
        lastTransition &&
        (!event.updatedAt ||
          Date.parse(event.updatedAt) < lastTransition ||
          !Number.isFinite(Date.parse(event.updatedAt)))
      )
        return [];
      origem = event.projectId ? 'projeto' : 'servico';
    }
    return [
      {
        id: event.id,
        projectId: event.projectId,
        serviceId: event.serviceId,
        origem,
        subtipo: event.tipo,
        titulo: event.titulo,
        data: event.data,
        hora: event.hora,
        local: event.local,
        descricao: event.descricao,
        participantes: event.participantes,
      },
    ];
  });
};

export const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let index = 0; index < startingDayOfWeek; index += 1) days.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day);
  return days;
};

export const formatMonthYear = (date: Date) =>
  date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

export const formatDateBR = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

export const getTipoColor = (item: AgendaItem) => {
  if (item.subtipo === 'status_deadline') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(`${item.data}T00:00:00`);
    const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / 86_400_000);
    if (daysRemaining <= 0) return 'bg-red-900/50 text-red-200 border-red-700';
    if (daysRemaining <= 3) return 'bg-yellow-900/50 text-yellow-200 border-yellow-700';
    return 'bg-cyan-900/50 text-cyan-200 border-cyan-700';
  }
  if (item.origem === 'projeto') return 'bg-blue-900/50 text-blue-300 border-blue-700';
  if (item.origem === 'servico') return 'bg-green-900/50 text-green-300 border-green-700';
  if (item.subtipo === 'manutencao') return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  if (item.subtipo === 'reuniao') return 'bg-purple-900/50 text-purple-300 border-purple-700';
  if (item.subtipo === 'vistoria') return 'bg-cyan-900/50 text-cyan-300 border-cyan-700';
  return 'bg-orange-900/50 text-orange-300 border-orange-700';
};

export const getTipoIcon = (item: AgendaItem) => {
  if (item.subtipo === 'status_deadline') return 'PZ';
  if (item.origem === 'projeto') return 'PR';
  if (item.origem === 'servico') return 'SV';
  if (item.subtipo === 'manutencao') return 'MN';
  if (item.subtipo === 'reuniao') return 'RE';
  if (item.subtipo === 'vistoria') return 'VS';
  return 'IN';
};

export const getOrigemLabel = (origem: OrigemAgenda) => {
  if (origem === 'projeto') return 'Projeto';
  if (origem === 'servico') return 'Serviço';
  return 'Evento';
};
