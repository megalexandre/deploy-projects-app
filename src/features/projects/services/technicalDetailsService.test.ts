import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/api/apiClient';
import { technicalDetailsService, type TechnicalDetailResponse } from './technicalDetailsService';
import type { Projeto } from '@/types';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

const detail: TechnicalDetailResponse = {
  id: 'detail-1',
  project_id: 'project-1',
  opening_date: '2026-06-13',
  supply_voltage: '127/220V',
  new_project: true,
  zero_grid_control: false,
  modules: [
    JSON.stringify({
      id: 'module-1',
      fabricante: 'Canadian',
      modelo: 'CS6W',
      potencia: 550,
      quantidade: 12,
      potenciaPico: 6.6,
    }),
  ],
  inverters: [],
  entry_standard_items: [],
  credit_divisions: [],
  created_at: '2026-06-13T12:00:00Z',
  updated_at: '2026-06-13T12:00:00Z',
};

const project = {
  id: 'project-1',
  dadosProjeto: {
    concessionaria: 'CEMIG',
    classe: 'Residencial',
    integrador: 'Integrador',
    modalidade: 'autoconsumo_local',
    enquadramento: 'Microgeracao',
    potenciaSistema: 6.6,
    protecaoCC: '',
  },
  dadosTecnicos: {
    tensao: 0,
    numeroFases: 0,
    ramal: '',
    disjuntor: '',
    cargaInstalada: 0,
    modulos: [],
    inversores: [],
    divisaoCreditos: [],
  },
  modulos: [],
  inversores: [],
  divisaoCreditos: [],
} as unknown as Projeto;

describe('technicalDetailsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('desserializa os arrays de strings retornados pelo backend', () => {
    const result = technicalDetailsService.apply(project, detail);

    expect(result.dataAbertura).toBe('2026-06-13');
    expect(result.projetoNovo).toBe('sim');
    expect(result.modulos[0]).toEqual(expect.objectContaining({ fabricante: 'Canadian' }));
  });

  it('cria detalhes tecnicos serializando objetos como strings JSON', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([]);
    vi.mocked(apiClient.post).mockResolvedValueOnce(detail);

    await technicalDetailsService.save('project-1', {
      dataAbertura: '2026-06-13',
      modulos: [
        {
          id: 'module-1',
          fabricante: 'Canadian',
          modelo: 'CS6W',
          potencia: 550,
          quantidade: 12,
          potenciaPico: 6.6,
        },
      ],
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/projects/project-1/technical_details',
      expect.objectContaining({
        opening_date: '2026-06-13',
        modules: [expect.stringContaining('"fabricante":"Canadian"')],
      }),
    );
  });

  it('atualiza o detalhe tecnico mais recente sem apagar campos omitidos', async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce([detail]);
    vi.mocked(apiClient.patch).mockResolvedValueOnce({ ...detail, supply_voltage: '380/220V' });

    await technicalDetailsService.save('project-1', { tensaoFornecimento: '380/220V' });

    expect(apiClient.patch).toHaveBeenCalledWith(
      '/projects/project-1/technical_details/detail-1',
      expect.objectContaining({
        supply_voltage: '380/220V',
        modules: detail.modules,
      }),
    );
  });
});
