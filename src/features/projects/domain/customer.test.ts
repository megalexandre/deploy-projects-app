import { describe, it, expect } from 'vitest';
import { toCustomer, type CustomerResponse } from './customer';
import type { AddressResponse } from './address';

const makeAddressResponse = (overrides: Partial<AddressResponse> = {}): AddressResponse => ({
  id: 'a-1',
  cep: '01310-100',
  address: 'Av. Paulista',
  number: '1000',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  ...overrides,
});

const makeCustomerResponse = (overrides: Partial<CustomerResponse> = {}): CustomerResponse => ({
  id: 'c-1',
  name: 'João Snow',
  email: 'joao@email.com',
  tax_id: '12.456.789-13',
  phone: '11999999999',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  ...overrides,
});

describe('toCustomer', () => {
  it('mapeia os campos básicos corretamente', () => {
    const result = toCustomer(makeCustomerResponse());

    expect(result.id).toBe('c-1');
    expect(result.nome).toBe('João Snow');
    expect(result.email).toBe('joao@email.com');
    expect(result.cpfCnpj).toBe('12.456.789-13');
    expect(result.telefone).toBe('11999999999');
    expect(result.documentos).toEqual([]);
  });

  it('mapeia o endereço aninhado quando presente', () => {
    const result = toCustomer(makeCustomerResponse({ address: makeAddressResponse() }));

    expect(result.endereco).toEqual({
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: '',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      link: undefined,
    });
    expect(result.addressId).toBe('a-1');
  });

  it('endereco é undefined quando address não vem na resposta', () => {
    const result = toCustomer(makeCustomerResponse({ address: undefined }));

    expect(result.endereco).toBeUndefined();
    expect(result.addressId).toBeUndefined();
  });
});
