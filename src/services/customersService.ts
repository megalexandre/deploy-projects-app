/** Camada de acesso a dados para 'customersService': concentra chamadas HTTP e transformacao basica de payloads. */
import { apiClient } from './apiClient';

export interface Customer {
  id: string;
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  enderecoCompleto?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

export interface CreateCustomerData {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  enderecoCompleto?: string;
  endereco?: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const buildEnderecoCompleto = (endereco?: CreateCustomerData['endereco']): string => {
  if (!endereco) {
    return '';
  }

  return [
    `${asString(endereco.logradouro).trim()}${asString(endereco.numero).trim() ? `, ${asString(endereco.numero).trim()}` : ''}`,
    asString(endereco.complemento).trim(),
    asString(endereco.bairro).trim(),
    `${asString(endereco.cidade).trim()}${asString(endereco.estado).trim() ? ` - ${asString(endereco.estado).trim().toUpperCase()}` : ''}`,
    asString(endereco.cep).trim() ? `CEP ${asString(endereco.cep).trim()}` : ''
  ]
    .filter(Boolean)
    .join(', ');
};

const normalizeEndereco = (raw: unknown): Customer['endereco'] => {
  const endereco = isRecord(raw) ? raw : {};

  const cep = asString(endereco.cep);
  const logradouro = asString(endereco.logradouro);
  const numero = asString(endereco.numero);
  const complemento = asString(endereco.complemento);
  const bairro = asString(endereco.bairro);
  const cidade = asString(endereco.cidade);
  const estado = asString(endereco.estado);

  const anyFilled = [cep, logradouro, numero, complemento, bairro, cidade, estado].some((item) => item.trim() !== '');
  if (!anyFilled) {
    return undefined;
  }

  return {
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado
  };
};

const normalizeCustomer = (raw: unknown): Customer => {
  const customer = isRecord(raw) ? raw : {};
  const enderecoRaw = isRecord(customer.endereco) ? customer.endereco : customer;
  const enderecoCompleto =
    asString(customer.enderecoCompleto) ||
    asString(customer.endereco_completo) ||
    asString(customer.address) ||
    asString(customer.place);

  return {
    id: asString(customer.id) || crypto.randomUUID(),
    nome: asString(customer.nome) || asString(customer.name),
    cpfCnpj: asString(customer.cpfCnpj) || asString(customer.taxId),
    telefone: asString(customer.telefone) || asString(customer.phone),
    email: asString(customer.email),
    enderecoCompleto: enderecoCompleto || undefined,
    endereco: normalizeEndereco(enderecoRaw)
  };
};

const CUSTOMERS_ENDPOINT = '/customers';

export const customersService = {
  async getAll(): Promise<Customer[]> {
    const response = await apiClient.get<unknown[] | { data?: unknown[] }>(CUSTOMERS_ENDPOINT);
    if (Array.isArray(response)) {
      return response.map(normalizeCustomer);
    }

    const data = isRecord(response) && Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeCustomer);
  },

  async create(customerData: CreateCustomerData): Promise<Customer> {
    const enderecoCompleto = customerData.enderecoCompleto?.trim() || buildEnderecoCompleto(customerData.endereco);
    const payload: Record<string, unknown> = {
      nome: customerData.nome,
      cpfCnpj: customerData.cpfCnpj,
      telefone: customerData.telefone,
      email: customerData.email
    };

    if (enderecoCompleto) {
      payload.enderecoCompleto = enderecoCompleto;
    }

    const response = await apiClient.post<unknown>(CUSTOMERS_ENDPOINT, payload);
    return normalizeCustomer(response);
  }
};
