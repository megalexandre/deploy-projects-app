import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/api/apiClient';
import { calendarioService } from './calendarioService';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('calendarioService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lista os eventos pela rota Rails e pelo intervalo informado', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    await calendarioService.list({ from: '2026-07-01', to: '2026-07-31' });

    expect(apiClient.get).toHaveBeenCalledWith('/calendar_events', {
      query: { from: '2026-07-01', to: '2026-07-31' },
    });
  });

  it('cria o vencimento do status na data calculada', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});

    vi.mocked(apiClient.get).mockResolvedValue([]);

    await calendarioService.saveStatusDeadline(
      'project-1',
      '255',
      'em_analise_concessionaria',
      'Em análise na concessionária',
      '2026-07-30',
      5,
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      '/calendar_events',
      expect.objectContaining({
        project_id: 'project-1',
        date: '2026-08-04',
        content: expect.objectContaining({
          duration_days: 5,
          start_date: '2026-07-30',
          type: 'status_deadline',
        }),
      }),
    );
  });

  it('atualiza o vencimento existente sem criar duplicidade', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      {
        id: 'event-1',
        project_id: 'project-1',
        date: '2026-08-01',
        content: {
          title: 'Prazo anterior',
          type: 'status_deadline',
          status: 'em_analise_concessionaria',
        },
        created_at: '2026-07-20T00:00:00Z',
        updated_at: '2026-07-20T00:00:00Z',
      },
    ]);
    vi.mocked(apiClient.patch).mockResolvedValue({});

    await calendarioService.saveStatusDeadline(
      'project-1',
      '255',
      'em_analise_concessionaria',
      'Em análise na concessionária',
      '2026-07-30',
      5,
    );

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/calendar_events/event-1',
      expect.objectContaining({ date: '2026-08-04' }),
    );
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('calcula vencimento atravessando a virada do ano', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClient.post).mockResolvedValue({});

    await calendarioService.saveStatusDeadline(
      'project-1',
      '255',
      'projeto_aprovado',
      'Projeto aprovado',
      '2026-12-30',
      5,
    );

    expect(apiClient.post).toHaveBeenCalledWith(
      '/calendar_events',
      expect.objectContaining({ date: '2027-01-04' }),
    );
  });
});
