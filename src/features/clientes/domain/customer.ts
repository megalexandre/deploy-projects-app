import type { Documento } from '@/types';

export interface CustomerAddress {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  link?: string;
}

export interface Customer {
  id: string;
  addressId?: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  enderecoCompleto?: string;
  endereco?: CustomerAddress;
  documentos: Documento[];
}

export interface CreateCustomerData {
  nome: string;
  addressId?: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
}

export interface UpdateCustomerData {
  nome?: string;
  addressId?: string;
  cpfCnpj?: string;
  telefone?: string;
  email?: string;
}
