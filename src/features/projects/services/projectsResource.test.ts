import { vi, describe, it, expect, beforeEach } from 'vitest';
import { projectsResource } from './projectsResource';
import { apiClient } from '@/shared/api/apiClient';
import type { ProjectResponse } from '../domain/project';
import type { CustomerResponse } from '../domain/customer';
import type { AddressResponse } from '../domain/address';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: { get: vi.fn() },
}));

const mockProject: ProjectResponse = {
  id: 'p-1',
  client_id: 'c-1',
  address_id: 'a-1',
  utility_company: 'Coelba',
  utility_protocol: 'PROJ-P1',
  customer_class: 'Residencial',
  integrator: 'Integrador X',
  modality: 'Geração Distribuída',
  framework: 'Microgeração',
  status: 'aguardando_assinatura_cliente',
  amount: '600.0',
  dc_protection: 'Disjuntor CC 20A',
  system_power: 1.34,
  unit_control: '12312312',
  project_type: 'fotovoltaico',
  fast_track: false,
  services_names: ['Ligacao Nova'],
  sequence: 3,
  statuses: [],
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-02T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
};

const mockCustomer: CustomerResponse = {
  id: 'c-1',
  name: 'João Snow',
  email: 'joao@email.com',
  tax_id: '12.456.789-13',
  phone: '11999999999',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
};

const mockAddress: AddressResponse = {
  id: 'a-1',
  cep: '01310-100',
  address: 'Av. Paulista',
  number: '1000',
  complement: 'Apto 42',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
};

describe('projectsResource.getById', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(mockCustomer)
      .mockResolvedValueOnce(mockAddress);
  });

  it('busca o projeto pelo id correto', async () => {
    await projectsResource.getById('p-1');
    expect(apiClient.get).toHaveBeenCalledWith('/projects/p-1');
  });

  it('busca o cliente usando client_id do projeto', async () => {
    await projectsResource.getById('p-1');
    expect(apiClient.get).toHaveBeenCalledWith('/customers/c-1');
  });

  it('busca o endereço usando address_id do projeto', async () => {
    await projectsResource.getById('p-1');
    expect(apiClient.get).toHaveBeenCalledWith('/addresses/a-1');
  });

  it('retorna Projeto com dados do cliente mapeados', async () => {
    const result = await projectsResource.getById('p-1');
    expect(result.cliente.nome).toBe('João Snow');
    expect(result.cliente.email).toBe('joao@email.com');
  });

  it('retorna Projeto com endereço do projeto mapeado', async () => {
    const result = await projectsResource.getById('p-1');
    expect(result.endereco.cep).toBe('01310-100');
    expect(result.endereco.logradouro).toBe('Av. Paulista');
  });

  it('endereço do projeto é independente do endereço do cliente', async () => {
    const customerWithAddress: CustomerResponse = {
      ...mockCustomer,
      address: { ...mockAddress, cep: '04538-133', address: 'Rua Funchal' },
    };
    vi.mocked(apiClient.get)
      .mockReset()
      .mockResolvedValueOnce(mockProject)
      .mockResolvedValueOnce(customerWithAddress)
      .mockResolvedValueOnce(mockAddress);

    const result = await projectsResource.getById('p-1');

    expect(result.endereco.cep).toBe('01310-100');
    expect(result.cliente.endereco?.cep).toBe('04538-133');
  });
});
