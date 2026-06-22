import type { Customer } from '@/features/clientes/domain/customer';
import { toAddress, type AddressResponse } from './address';

export interface CustomerResponse {
  id: string;
  name: string;
  email: string;
  tax_id: string;
  phone: string;
  address?: AddressResponse;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

export const toCustomer = (r: CustomerResponse): Customer => ({
  id: r.id,
  nome: r.name,
  email: r.email,
  cpfCnpj: r.tax_id,
  telefone: r.phone,
  documentos: [],
  addressId: r.address?.id,
  endereco: r.address ? toAddress(r.address) : undefined,
});
