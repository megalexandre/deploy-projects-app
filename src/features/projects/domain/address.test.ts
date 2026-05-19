import { describe, it, expect } from 'vitest';
import { toAddress, type AddressResponse } from './address';

const makeAddressResponse = (overrides: Partial<AddressResponse> = {}): AddressResponse => ({
  id: 'a-1',
  cep: '01310-100',
  address: 'Av. Paulista',
  number: '1000',
  complement: 'Apto 42',
  neighborhood: 'Bela Vista',
  city: 'São Paulo',
  state: 'SP',
  place: 'Paulista',
  link: 'https://maps.example.com/123',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  created_by: 'user-1',
  updated_by: 'user-1',
  ...overrides,
});

describe('toAddress', () => {
  it('mapeia os campos corretamente', () => {
    const result = toAddress(makeAddressResponse());

    expect(result).toEqual({
      cep: '01310-100',
      logradouro: 'Av. Paulista',
      numero: '1000',
      complemento: 'Apto 42',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      estado: 'SP',
      link: 'https://maps.example.com/123',
    });
  });

  it('usa string vazia quando complement é undefined', () => {
    const result = toAddress(makeAddressResponse({ complement: undefined }));
    expect(result.complemento).toBe('');
  });

  it('passa link como undefined quando ausente', () => {
    const result = toAddress(makeAddressResponse({ link: undefined }));
    expect(result.link).toBeUndefined();
  });
});
