import type { Endereco } from '@/core/entities/comum';

export interface AddressResponse {
  id: string;
  cep: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  place?: string;
  link?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export const toAddress = (r: AddressResponse): Endereco => ({
  cep: r.cep,
  logradouro: r.address,
  numero: r.number,
  complemento: r.complement ?? '',
  bairro: r.neighborhood,
  cidade: r.city,
  estado: r.state,
  link: r.link,
});
