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
  secondary_protocol: 'CEMIG-2026-001',
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

  it('envia lista vazia quando o projeto e criado sem servicos marcados', async () => {
    await projectsService.create({
      ...createProjectData,
      servicesNames: [],
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/projects',
      expect.objectContaining({
        services_names: [],
      }),
    );
  });

  it('nao limpa servicos ao atualizar outro campo do projeto', async () => {
    await projectsService.update('project-1', {
      framework: 'Minigeracao',
    });

    expect(vi.mocked(apiClient.put).mock.calls[0][1]).toEqual(
      expect.objectContaining({
        framework: 'Minigeracao',
        services_names: undefined,
      }),
    );
  });

  it('envia o protocolo da concessionaria separadamente ao atualizar o projeto', async () => {
    await projectsService.update('project-1', {
      secondaryProtocol: 'CEMIG-2026-002',
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/projects/project-1',
      expect.objectContaining({
        secondary_protocol: 'CEMIG-2026-002',
        utility_protocol: undefined,
      }),
    );
  });

  it('envia o projeto EMUC relacionado ao atualizar o orcamento', async () => {
    await projectsService.update('project-1', {
      relatedProjectId: 'emuc-1',
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/projects/project-1',
      expect.objectContaining({
        related_project_id: 'emuc-1',
      }),
    );
  });

  it('envia subsequence nulo ao remover o subsequente do identificador', async () => {
    await projectsService.update('project-1', {
      sequence: 255,
      subsequente: null,
    });

    expect(apiClient.put).toHaveBeenCalledWith(
      '/projects/project-1',
      expect.objectContaining({
        sequence: 255,
        subsequence: null,
      }),
    );
  });
});

describe('projectsService project address enrichment', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('usa o endereco do projeto antes do endereco do cliente na listagem', async () => {
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/projects') {
        return [
          {
            ...projectResponse,
            address_id: 'project-address-1',
          },
        ];
      }

      if (url === '/addresses/project-address-1') {
        return {
          id: 'project-address-1',
          cep: '30140-071',
          address: 'Rua do Projeto',
          place: 'Rua do Projeto',
          number: '200',
          neighborhood: 'Funcionarios',
          city: 'Belo Horizonte',
          state: 'MG',
        };
      }

      if (url === '/customers') {
        return [
          {
            id: 'client-1',
            name: 'Cliente Teste',
            address: {
              cep: '01310-100',
              address: 'Av. do Cliente',
              number: '1000',
              neighborhood: 'Bela Vista',
              city: 'Sao Paulo',
              state: 'SP',
            },
          },
        ];
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const [project] = await projectsService.getAll();

    expect(project.endereco.logradouro).toBe('Rua do Projeto');
    expect(project.endereco.numero).toBe('200');
    expect(apiClient.get).toHaveBeenCalledWith('/addresses/project-address-1');
  });

  it('usa o endereco do cliente quando o endereco do projeto nao pode ser carregado', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/projects') {
        return [
          {
            ...projectResponse,
            address_id: 'project-address-1',
          },
        ];
      }

      if (url === '/addresses/project-address-1') {
        throw new Error('Forbidden');
      }

      if (url === '/customers') {
        return [
          {
            id: 'client-1',
            name: 'Cliente Teste',
            address: {
              cep: '01310-100',
              address: 'Av. do Cliente',
              number: '1000',
              neighborhood: 'Bela Vista',
              city: 'Sao Paulo',
              state: 'SP',
            },
          },
        ];
      }

      throw new Error(`Unexpected URL: ${url}`);
    });

    const [project] = await projectsService.getAll();

    expect(project.endereco.logradouro).toBe('Av. do Cliente');
    expect(project.endereco.numero).toBe('1000');
    consoleErrorSpy.mockRestore();
  });
});

describe('projectsService project lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('cancela o projeto registrando o motivo no historico de status', async () => {
    vi.mocked(apiClient.post).mockResolvedValue({});
    vi.mocked(apiClient.get).mockResolvedValue({
      ...projectResponse,
      status: 'projeto_cancelado',
    });

    const result = await projectsService.cancel('project-1', 'Cliente desistiu');

    expect(apiClient.post).toHaveBeenCalledWith('/projects/project-1/statuses', {
      name: 'projeto_cancelado',
      comment: 'Cliente desistiu',
    });
    expect(apiClient.get).toHaveBeenCalledWith('/projects/project-1');
    expect(result.status).toBe('projeto_cancelado');
  });

  it('inativa o projeto pela rota de exclusao logica existente', async () => {
    vi.mocked(apiClient.patch).mockResolvedValue(undefined);

    await projectsService.inactivate('project-1');

    expect(apiClient.patch).toHaveBeenCalledWith('/projects/project-1/inactivate');
  });

  it('exclui definitivamente o projeto pela rota existente', async () => {
    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    await projectsService.delete('project-1');

    expect(apiClient.delete).toHaveBeenCalledWith('/projects/project-1');
  });
});
