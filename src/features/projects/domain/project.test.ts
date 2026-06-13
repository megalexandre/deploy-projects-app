import { describe, it, expect } from 'vitest';
import { toProjeto, type ProjectResponse } from './project';
import type { Customer } from '@/features/clientes/domain/customer';
import type { Endereco } from '@/core/entities/comum';

const makeProjectResponse = (overrides: Partial<ProjectResponse> = {}): ProjectResponse => ({
  id: 'p-1',
  client_id: 'c-1',
  address_id: 'a-1',
  utility_company: 'Coelba',
  utility_protocol: 'PROJ-P1',
  customer_class: 'Residencial',
  integrator: 'b6f8a0e2-4f6e-4b0a-9c1d-2e3f4a5b6c7d',
  integrator_name: 'Integrador X',
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
  ...overrides,
});

const makeCustomer = (overrides: Partial<Customer> = {}): Customer => ({
  id: 'c-1',
  nome: 'João Snow',
  email: 'joao@email.com',
  cpfCnpj: '12.456.789-13',
  telefone: '11999999999',
  documentos: [],
  ...overrides,
});

const makeEndereco = (overrides: Partial<Endereco> = {}): Endereco => ({
  cep: '01310-100',
  logradouro: 'Av. Paulista',
  numero: '1000',
  complemento: 'Apto 42',
  bairro: 'Bela Vista',
  cidade: 'São Paulo',
  estado: 'SP',
  ...overrides,
});

describe('toProjeto', () => {
  it('mapeia os campos do projeto corretamente', () => {
    const result = toProjeto(makeProjectResponse());

    expect(result.id).toBe('p-1');
    expect(result.protocolo).toBe('PROJ-P1');
    expect(result.sequence).toBe(3);
    expect(result.valor).toBe(600);
    expect(result.tipoProjeto).toBe('fotovoltaico');
    expect(result.servicos).toEqual(['Ligacao Nova']);
    expect(result.projetoFastTrack).toBe('nao');
    expect(result.dataCriacao).toBe('2026-01-01T00:00:00.000Z');
    expect(result.dataAtualizacao).toBe('2026-01-02T00:00:00.000Z');
  });

  it('usa integrator_name como integrador para exibição', () => {
    const result = toProjeto(makeProjectResponse());
    expect(result.dadosProjeto.integrador).toBe('Integrador X');
  });

  it('usa o uuid do integrator quando integrator_name está ausente', () => {
    const result = toProjeto(makeProjectResponse({ integrator_name: null }));
    expect(result.dadosProjeto.integrador).toBe('b6f8a0e2-4f6e-4b0a-9c1d-2e3f4a5b6c7d');
  });

  it('integrador fica vazio quando projeto não tem integrator', () => {
    const result = toProjeto(makeProjectResponse({ integrator: null, integrator_name: null }));
    expect(result.dadosProjeto.integrador).toBe('');
  });

  it('normaliza o status', () => {
    const result = toProjeto(makeProjectResponse({ status: 'aguardando_assinatura_cliente' }));
    expect(result.status).toBe('aguardando_assinatura_cliente');
  });

  it('normaliza status legado', () => {
    const result = toProjeto(makeProjectResponse({ status: 'pendente' }));
    expect(result.status).toBe('em_analise_documentacao');
  });

  it('fast_track true vira "sim"', () => {
    const result = toProjeto(makeProjectResponse({ fast_track: true }));
    expect(result.projetoFastTrack).toBe('sim');
  });

  it('usa client_id como fallback quando customer não é passado', () => {
    const result = toProjeto(makeProjectResponse());
    expect(result.cliente.id).toBe('c-1');
    expect(result.cliente.nome).toBe('');
  });

  it('preenche cliente quando customer é passado', () => {
    const result = toProjeto(makeProjectResponse(), makeCustomer());

    expect(result.cliente.id).toBe('c-1');
    expect(result.cliente.nome).toBe('João Snow');
    expect(result.cliente.email).toBe('joao@email.com');
  });

  it('usa endereco vazio quando não é passado', () => {
    const result = toProjeto(makeProjectResponse());
    expect(result.endereco.cep).toBe('');
  });

  it('preenche endereco do projeto quando é passado', () => {
    const result = toProjeto(makeProjectResponse(), undefined, makeEndereco());
    expect(result.endereco.cep).toBe('01310-100');
    expect(result.endereco.logradouro).toBe('Av. Paulista');
  });

  it('endereco do cliente é independente do endereco do projeto', () => {
    const customer = makeCustomer({
      endereco: makeEndereco({ cep: '04538-133', logradouro: 'Rua Funchal' }),
    });
    const projetoEndereco = makeEndereco({ cep: '01310-100', logradouro: 'Av. Paulista' });

    const result = toProjeto(makeProjectResponse(), customer, projetoEndereco);

    expect(result.endereco.cep).toBe('01310-100');
    expect(result.cliente.endereco?.cep).toBe('04538-133');
  });

  it('mapeia coordenadas quando presentes', () => {
    const result = toProjeto(
      makeProjectResponse({ coordinates: { latitude: '-23.5', longitude: '-46.6' } }),
    );
    expect(result.coordenadas).toEqual({ latitude: '-23.5', longitude: '-46.6' });
    expect(result.latitude).toBe('-23.5');
  });

  it('coordenadas são undefined quando ausentes', () => {
    const result = toProjeto(makeProjectResponse({ coordinates: undefined }));
    expect(result.coordenadas).toBeUndefined();
  });
});
