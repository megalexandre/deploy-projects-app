import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/api/apiClient';
import { projectsService } from './projectsService';
import type { CreateProjectData } from './projectTypes';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const projectResponse = {
  id: 'project-1',
  client_id: 'client-1',
  utility_company: 'CEMIG',
  utility_protocol: 'P-001',
  customer_class: 'Residencial',
  integrator: 'Integrador X',
  modality: 'AUTOCONSUMO LOCAL',
  framework: 'Microgeracao',
  unit_control: 'UC-1',
  project_type: 'fotovoltaico',
};

const createProjectData: CreateProjectData = {
  clientId: 'client-1',
  utilityCompany: 'CEMIG',
  utilityProtocol: 'P-001',
  customerClass: 'Residencial',
  integrator: 'Integrador X',
  modality: 'AUTOCONSUMO LOCAL',
  framework: 'Microgeracao',
  unitControl: 'UC-1',
  projectType: 'fotovoltaico',
  coordinates: {
    latitude: '-19.900000',
    longitude: '-43.900000',
  },
};

describe('projectsService coordinates payload', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(apiClient.post).mockResolvedValue(projectResponse);
    vi.mocked(apiClient.put).mockResolvedValue(projectResponse);
  });

  it('envia coordenadas em WKT ao criar um projeto', async () => {
    await projectsService.create(createProjectData);

    expect(apiClient.post).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        coordinates: 'POINT(-43.9 -19.9)',
      }),
    );
    expect(vi.mocked(apiClient.post).mock.calls[0][1]).not.toHaveProperty('coordenadas');
  });

  it('envia coordenadas em WKT ao atualizar um projeto', async () => {
    await projectsService.update('project-1', {
      coordinates: createProjectData.coordinates,
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/projects/project-1',
      expect.objectContaining({
        coordinates: 'POINT(-43.9 -19.9)',
      }),
    );
    expect(vi.mocked(apiClient.put).mock.calls[0][1]).not.toHaveProperty('coordenadas');
  });

  it('nao converte coordenadas vazias para POINT(0 0)', async () => {
    await projectsService.update('project-1', {
      coordinates: { latitude: '', longitude: '' },
    });

    expect(vi.mocked(apiClient.put).mock.calls[0][1]).toEqual(
      expect.objectContaining({ coordinates: undefined }),
    );
  });
});
