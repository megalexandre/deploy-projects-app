import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectsService, servicosService } from '@/services';
import { calendarioService, type CalendarEvent } from '../services/calendarioService';
import { getAgendaRange, localDateKey } from '../domain/calendar';
import { useCalendario } from './useCalendario';
import type { Projeto } from '@/types';

vi.mock('@/services', () => ({
  projectsService: { getProjetos: vi.fn() },
  servicosService: { list: vi.fn() },
}));
vi.mock('../services/calendarioService', () => ({
  calendarioService: { list: vi.fn(), remove: vi.fn() },
}));
const project = { id: 'p1', status: 'projeto_aprovado', timeline: [] } as unknown as Projeto;
const currentDate = new Date();
const date = (day: number, offset = 0) =>
  localDateKey(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, day));
const event = (overrides: Partial<CalendarEvent> = {}): CalendarEvent => ({
  id: 'deadline',
  project_id: 'p1',
  date: date(10),
  content: { title: 'Prazo atual', type: 'status_deadline', status: 'projeto_aprovado' },
  created_at: date(1) + 'T12:00:00Z',
  updated_at: date(2) + 'T12:00:00Z',
  ...overrides,
});
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(projectsService.getProjetos).mockResolvedValue([project]);
  vi.mocked(servicosService.list).mockResolvedValue([]);
  vi.mocked(calendarioService.list).mockResolvedValue([event()]);
});
afterEach(cleanup);

describe('sincronização da agenda', () => {
  it('preserva o status do evento e remove o prazo antigo após atualizar ao voltar à aba', async () => {
    const { result } = renderHook(useCalendario);
    await waitFor(() => expect(result.current.getItensForDay(10)).toHaveLength(1));
    vi.mocked(projectsService.getProjetos).mockResolvedValue([
      { ...project, status: 'obras_concessionaria' },
    ]);
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });
    await waitFor(() => expect(result.current.getItensForDay(10)).toEqual([]));
    expect(projectsService.getProjetos).toHaveBeenLastCalledWith({
      forceRefresh: true,
      includeProjectAddresses: false,
    });
    expect(calendarioService.remove).not.toHaveBeenCalled();
  });
  it('mostra passado ao selecionar o dia e limita próximos itens ao mês e a hoje em diante', async () => {
    vi.mocked(calendarioService.list).mockResolvedValue([
      event({ id: 'past', date: date(1), content: { title: 'Reunião passada', type: 'reuniao' } }),
      event({
        id: 'next-month',
        date: date(10, 1),
        content: { title: 'Outro mês', type: 'reuniao' },
      }),
    ]);
    const { result } = renderHook(useCalendario);
    await waitFor(() => expect(result.current.loadingProjetos).toBe(false));
    expect(result.current.agendaLista.some((item) => item.id === 'next-month')).toBe(false);
    if (currentDate.getDate() > 1)
      expect(result.current.agendaLista.some((item) => item.id === 'past')).toBe(false);
    act(() => result.current.setSelectedDayFilter(1));
    expect(result.current.agendaLista.map((item) => item.id)).toEqual(['past']);
  });
  it('ignora resposta atrasada do mês anterior e limpa o dia selecionado ao navegar', async () => {
    let finish!: (events: CalendarEvent[]) => void;
    vi.mocked(calendarioService.list)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue([
        event({
          id: 'new-month',
          date: date(10, 1),
          content: { title: 'Mês novo', type: 'reuniao' },
        }),
      ]);
    const { result } = renderHook(useCalendario);
    act(() => {
      result.current.setSelectedDayFilter(10);
    });
    act(() => {
      result.current.navigateMonth('next');
    });
    await waitFor(() =>
      expect(result.current.getItensForDay(10).map((item) => item.id)).toEqual(['new-month']),
    );
    await act(async () => {
      finish([event()]);
    });
    expect(result.current.getItensForDay(10).map((item) => item.id)).toEqual(['new-month']);
    expect(result.current.selectedDayFilter).toBeNull();
  });
  it('limita a semana aos dias corretos, inclusive ao atravessar o mês', async () => {
    const { result } = renderHook(useCalendario);
    await waitFor(() => expect(result.current.loadingProjetos).toBe(false));
    act(() => {
      result.current.setViewMode('semana');
      result.current.setSelectedDayFilter(1);
    });
    await waitFor(() => expect(result.current.loadingProjetos).toBe(false));
    const range = getAgendaRange(result.current.selectedDate, 'semana', 1);
    expect(
      result.current.agendaFiltradaOrdenada.every(
        (item) => item.data >= range.from && item.data <= range.to,
      ),
    ).toBe(true);
    expect(calendarioService.list).toHaveBeenLastCalledWith();
  });

  it('atualiza periodicamente e remove o temporizador ao sair da tela', async () => {
    let tick: (() => void) | undefined;
    const timers: Pick<Window, 'setInterval' | 'clearInterval'> = window;
    const originalInterval = timers.setInterval.bind(timers);
    const timer = vi.spyOn(timers, 'setInterval').mockImplementation((callback, delay, ...args) => {
      if (delay !== 60_000) return originalInterval(callback, delay, ...args);
      if (typeof callback === 'function') tick = callback as () => void;
      return 999_999;
    });
    const clear = vi.spyOn(timers, 'clearInterval');
    try {
      const { result, unmount } = renderHook(useCalendario);
      await waitFor(() => expect(result.current.getItensForDay(10)).toHaveLength(1));
      vi.mocked(projectsService.getProjetos).mockResolvedValue([
        { ...project, status: 'projeto_encerrado' },
      ]);
      await act(async () => {
        tick?.();
      });
      await waitFor(() => expect(result.current.getItensForDay(10)).toEqual([]));
      unmount();
      expect(timer).toHaveBeenCalledWith(expect.any(Function), 60_000);
      expect(clear).toHaveBeenCalledWith(999_999);
    } finally {
      timer.mockRestore();
      clear.mockRestore();
    }
  });
});
