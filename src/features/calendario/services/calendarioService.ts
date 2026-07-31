import { apiClient } from '@/shared/api/apiClient';
import type { TipoEventoManual } from '../domain/calendar';

export interface CalendarEventContent {
  title: string;
  time?: string;
  location?: string;
  participants?: string[];
  description?: string;
  type?: TipoEventoManual | 'status_deadline';
  status?: string;
  start_date?: string;
  duration_days?: number;
}

export interface CalendarEvent {
  id: string;
  project_id?: string | null;
  date: string;
  content: CalendarEventContent;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventPayload {
  project_id?: string | null;
  date: string;
  content: CalendarEventContent;
}

export const calendarioService = {
  list: (params?: { from?: string; to?: string }) =>
    apiClient.get<CalendarEvent[]>('/calendar_events', { query: params }),

  create: (payload: CalendarEventPayload) =>
    apiClient.post<CalendarEvent>('/calendar_events', payload),

  update: (id: string, payload: Partial<CalendarEventPayload>) =>
    apiClient.patch<CalendarEvent>(`/calendar_events/${id}`, payload),

  remove: async (id: string) => {
    await apiClient.delete(`/calendar_events/${id}`);
  },

  saveStatusDeadline: async (
    projectId: string,
    projectLabel: string,
    status: string,
    statusLabel: string,
    startDate: string,
    durationDays: number,
  ) => {
    const deadline = new Date(`${startDate}T00:00:00`);
    deadline.setDate(deadline.getDate() + durationDays);

    const payload: CalendarEventPayload = {
      project_id: projectId,
      date: deadline.toISOString().slice(0, 10),
      content: {
        title: `Vencimento: ${statusLabel} — ${projectLabel}`,
        time: '09:00',
        location: '',
        participants: ['Equipe de Projetos'],
        description: `Prazo de ${durationDays} dia(s) a partir de ${startDate}.`,
        type: 'status_deadline',
        status,
        start_date: startDate,
        duration_days: durationDays,
      },
    };
    const events = await calendarioService.list();
    const existing = events
      .filter(
        (event) =>
          event.project_id === projectId &&
          event.content.type === 'status_deadline' &&
          event.content.status === status,
      )
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0];

    return existing
      ? calendarioService.update(existing.id, payload)
      : calendarioService.create(payload);
  },
};
