import { describe, expect, it } from 'vitest';
import type { Projeto, Servico } from '@/types';
import {
  buildAgendaItems,
  filterAgendaPeriod,
  getAgendaRange,
  type EventoManual,
} from './calendar';

const project = (overrides: Partial<Projeto> = {}) =>
  ({
    id: 'p1',
    status: 'projeto_aprovado',
    timeline: [],
    ...overrides,
  }) as Projeto;
const service = (overrides: Partial<Servico> = {}) =>
  ({
    id: 's1',
    status: 'servico_aprovado',
    timeline: [],
    ...overrides,
  }) as Servico;
const event = (overrides: Partial<EventoManual> = {}): EventoManual => ({
  id: 'deadline',
  projectId: 'p1',
  titulo: 'Prazo',
  tipo: 'status_deadline',
  status: 'projeto_aprovado',
  updatedAt: '2026-11-03T12:00:01Z',
  data: '2026-11-08',
  hora: '09:00',
  local: '',
  descricao: '',
  participantes: [],
  ...overrides,
});

describe('agenda sem histórico de status', () => {
  it('não transforma histórico, criação ou abertura em compromissos', () => {
    const timeline = [
      { id: 'old', etapa: 'Análise', data: '2026-11-01', status: 'concluido' as const },
      { id: 'now', etapa: 'Aprovado', data: '2026-11-03', status: 'em_andamento' as const },
    ];
    expect(
      buildAgendaItems(
        [],
        [project({ timeline, dataCriacao: '2026-11-01' })],
        [service({ timeline, dataAbertura: '2026-11-01' })],
      ),
    ).toEqual([]);
    expect(
      buildAgendaItems(
        [],
        [project({ dataCriacao: '2026-11-01' })],
        [service({ dataAbertura: '2026-11-01' })],
      ),
    ).toEqual([]);
  });
  it('preserva compromissos manuais mesmo com projeto encerrado ou ausente', () => {
    const manual = event({ tipo: 'reuniao' });
    expect(
      buildAgendaItems([manual], [project({ status: 'projeto_encerrado' })], []),
    ).toMatchObject([{ id: manual.id, origem: 'evento' }]);
    expect(buildAgendaItems([manual], [], [])).toHaveLength(1);
  });
  it('mostra apenas um prazo do status atual e classifica como projeto', () => {
    const records = [
      event({ id: 'old', status: 'em_analise_concessionaria', updatedAt: '2026-11-01T12:00:00Z' }),
      event({ id: 'duplicate', updatedAt: '2026-11-02T12:00:00Z' }),
      event(),
    ];
    expect(buildAgendaItems(records, [project()], [])).toMatchObject([
      { id: 'deadline', origem: 'projeto', subtipo: 'status_deadline' },
    ]);
  });
  it.each(['projeto_encerrado', 'projeto_cancelado'] as const)(
    'oculta os prazos de %s',
    (status) => {
      expect(buildAgendaItems([event({ status })], [project({ status })], [])).toEqual([]);
    },
  );
  it('oculta prazo órfão, sem status ou pertencente à etapa anterior', () => {
    expect(buildAgendaItems([event()], [], [])).toEqual([]);
    expect(buildAgendaItems([event({ status: undefined })], [project()], [])).toEqual([]);
    expect(
      buildAgendaItems([event({ status: 'em_analise_concessionaria' })], [project()], []),
    ).toEqual([]);
  });
  it('não ressuscita prazo de uma passagem anterior pelo mesmo status', () => {
    const current = project({
      timeline: [
        {
          id: 'new-visit',
          etapa: 'Projeto aprovado',
          data: '2026-11-04T12:00:00Z',
          status: 'concluido',
        },
      ],
    });
    expect(buildAgendaItems([event()], [current], [])).toEqual([]);
    expect(
      buildAgendaItems([event({ updatedAt: '2026-11-04T12:00:01Z' })], [current], []),
    ).toHaveLength(1);
  });
  it('não escolhe um prazo mais antigo só porque seu status coincide', () => {
    expect(
      buildAgendaItems(
        [
          event(),
          event({ id: 'new', status: 'obras_concessionaria', updatedAt: '2026-11-04T12:00:00Z' }),
        ],
        [project()],
        [],
      ),
    ).toEqual([]);
  });

  it('não faz prazo duplicado reaparecer ao consultar o mês anterior', () => {
    const items = buildAgendaItems(
      [
        event({ id: 'old', data: '2026-11-08' }),
        event({ id: 'rescheduled', data: '2026-12-08', updatedAt: '2026-11-04T12:00:00Z' }),
      ],
      [project()],
      [],
    );
    expect(filterAgendaPeriod(items, { from: '2026-11-01', to: '2026-11-30' }, 'todos')).toEqual(
      [],
    );
    expect(
      filterAgendaPeriod(items, { from: '2026-12-01', to: '2026-12-31' }, 'todos'),
    ).toMatchObject([{ id: 'rescheduled' }]);
  });
  it('mantém prazo vencido se a etapa continua ativa e trata prazo de serviço quando informado', () => {
    expect(buildAgendaItems([event({ data: '2020-01-01' })], [project()], [])).toHaveLength(1);
    expect(
      buildAgendaItems(
        [event({ projectId: undefined, serviceId: 's1', status: 'servico_aprovado' })],
        [],
        [service()],
      ),
    ).toMatchObject([{ origem: 'servico', serviceId: 's1' }]);
    expect(
      buildAgendaItems(
        [event({ projectId: undefined, serviceId: 's1', status: 'servico_encerrado' })],
        [],
        [service({ status: 'servico_encerrado' })],
      ),
    ).toEqual([]);
  });
});

describe('intervalos do calendário', () => {
  it('calcula semana que atravessa mês e ano', () => {
    expect(getAgendaRange(new Date(2027, 0, 1), 'semana', 1)).toEqual({
      from: '2026-12-27',
      to: '2027-01-02',
    });
    expect(getAgendaRange(new Date(2026, 10, 1), 'mes', null)).toEqual({
      from: '2026-11-01',
      to: '2026-11-30',
    });
    expect(getAgendaRange(new Date(2026, 10, 1), 'dia', null, new Date(2026, 10, 3))).toEqual({
      from: '2026-11-03',
      to: '2026-11-03',
    });
  });
  it('filtra pelo intervalo real da visualização e ordena por data e hora', () => {
    const items = buildAgendaItems(
      [
        event({ id: 'later', tipo: 'reuniao', data: '2026-11-08' }),
        event({ id: 'outside', tipo: 'reuniao', data: '2026-10-01' }),
        event({ id: 'first', tipo: 'reuniao', data: '2026-11-04' }),
      ],
      [],
      [],
    );
    expect(
      filterAgendaPeriod(items, { from: '2026-11-01', to: '2026-11-30' }, 'todos').map(
        (item) => item.id,
      ),
    ).toEqual(['first', 'later']);
    expect(filterAgendaPeriod(items, { from: '2026-11-01', to: '2026-11-30' }, 'projeto')).toEqual(
      [],
    );
  });
});
