/** Camada de acesso a dados para 'customersService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Documento } from '../types';
import { apiClient } from './apiClient';

export interface Customer {
  id: string;
  addressId?: string;
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
    link?: string;
  };
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

type UnknownRecord = Record<string, unknown>;
type CustomerEnhancement = {
  documentos?: Documento[];
};

const CUSTOMER_ENHANCEMENTS_STORAGE_KEY = 'opj_frontend_customer_enhancements';

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBrowser = typeof window !== 'undefined';

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

const normalizeDocumentos = (documentos?: unknown): Documento[] =>
  (Array.isArray(documentos) ? documentos : []).map((item) => {
    const documento = isRecord(item) ? item : {};

    return {
      id: asString(documento.id) || crypto.randomUUID(),
      nome: asString(documento.nome) || asString(documento.name) || 'Documento',
      tipo: asString(documento.tipo) || asString(documento.type) || 'Documento',
      dataUpload: asString(documento.dataUpload) || asString(documento.createdAt) || new Date().toISOString(),
      tamanho: asNumber(documento.tamanho ?? documento.size),
      fileId: asString(documento.fileId) || asString(documento.id) || undefined,
      url: asString(documento.url) || asString(documento.urlS3) || undefined
    };
  });

const readCustomerEnhancements = (): Record<string, CustomerEnhancement> => {
  if (!isBrowser) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CUSTOMER_ENHANCEMENTS_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? (parsed as Record<string, CustomerEnhancement>) : {};
  } catch (error) {
    console.error('Erro ao carregar dados locais complementares de clientes:', error);
    return {};
  }
};

const writeCustomerEnhancements = (enhancements: Record<string, CustomerEnhancement>) => {
  if (!isBrowser) {
    return;
  }

  try {
    window.localStorage.setItem(CUSTOMER_ENHANCEMENTS_STORAGE_KEY, JSON.stringify(enhancements));
  } catch (error) {
    console.error('Erro ao salvar dados locais complementares de clientes:', error);
  }
};

const updateCustomerEnhancement = (
  customerId: string,
  updater: (current: CustomerEnhancement | undefined) => CustomerEnhancement
) => {
  const current = readCustomerEnhancements();
  current[customerId] = updater(current[customerId]);
  writeCustomerEnhancements(current);
};

const mergeCustomerEnhancement = (customer: Customer): Customer => {
  const enhancement = readCustomerEnhancements()[customer.id];
  if (!enhancement) {
    return customer;
  }

  return {
    ...customer,
    documentos: enhancement.documentos?.length ? enhancement.documentos : customer.documentos
  };
};

const normalizeEndereco = (raw: unknown): Customer['endereco'] => {
  const endereco = isRecord(raw) ? raw : {};

  const cep = asString(endereco.cep);
  const logradouro = asString(endereco.logradouro) || asString(endereco.address) || asString(endereco.place);
  const numero = asString(endereco.numero) || asString(endereco.number);
  const complemento = asString(endereco.complemento) || asString(endereco.complement);
  const bairro = asString(endereco.bairro) || asString(endereco.neighborhood);
  const cidade = asString(endereco.cidade) || asString(endereco.city);
  const estado = asString(endereco.estado) || asString(endereco.state);
  const link = asString(endereco.link);

  const anyFilled = [cep, logradouro, numero, complemento, bairro, cidade, estado, link].some((item) => item.trim() !== '');
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
    estado,
    link: link || undefined
  };
};

const normalizeCustomer = (raw: unknown): Customer => {
  const customer = isRecord(raw) ? raw : {};
  const nestedAddress =
    (isRecord(customer.endereco) ? customer.endereco : null) ||
    (isRecord(customer.address) ? customer.address : null);
  const enderecoRaw = nestedAddress ?? customer;
  const enderecoCompleto =
    asString(customer.enderecoCompleto) ||
    asString(customer.endereco_completo) ||
    asString(customer.address) ||
    asString(customer.place);
  const nestedAddressId = nestedAddress ? asString(nestedAddress.id) : '';

  return {
    id: asString(customer.id) || crypto.randomUUID(),
    addressId: asString(customer.addressId) || nestedAddressId || undefined,
    nome: asString(customer.nome) || asString(customer.name),
    cpfCnpj: asString(customer.cpfCnpj) || asString(customer.taxId),
    telefone: asString(customer.telefone) || asString(customer.phone),
    email: asString(customer.email),
    enderecoCompleto: enderecoCompleto || undefined,
    endereco: normalizeEndereco(enderecoRaw),
    documentos: normalizeDocumentos(customer.documentos)
  };
};

const CUSTOMERS_ENDPOINT = '/customers';

const buildCustomerPayload = (customerData: CreateCustomerData | UpdateCustomerData) => {
  const payload: Record<string, unknown> = {};

  if (customerData.nome !== undefined) {
    payload.nome = customerData.nome;
  }

  if (customerData.cpfCnpj !== undefined) {
    payload.cpfCnpj = customerData.cpfCnpj;
  }

  if (customerData.telefone !== undefined) {
    payload.telefone = customerData.telefone;
  }

  if (customerData.email !== undefined) {
    payload.email = customerData.email;
  }

  if (customerData.addressId !== undefined) {
    payload.addressId = customerData.addressId;
  }

  return payload;
};

export const customersService = {
  saveDocuments(customerId: string, documentos: Documento[]) {
    updateCustomerEnhancement(customerId, (current) => ({
      ...current,
      documentos
    }));
  },

  async getAll(): Promise<Customer[]> {
    const response = await apiClient.get<unknown[] | { data?: unknown[] }>(CUSTOMERS_ENDPOINT);
    if (Array.isArray(response)) {
      return response.map(normalizeCustomer).map(mergeCustomerEnhancement);
    }

    const data = isRecord(response) && Array.isArray(response.data) ? response.data : [];
    return data.map(normalizeCustomer).map(mergeCustomerEnhancement);
  },

  async create(customerData: CreateCustomerData): Promise<Customer> {
    const payload = buildCustomerPayload(customerData);
    const response = await apiClient.post<unknown>(CUSTOMERS_ENDPOINT, payload);
    return mergeCustomerEnhancement(normalizeCustomer(response));
  },

  async getById(id: string): Promise<Customer> {
    const response = await apiClient.get<unknown>(`${CUSTOMERS_ENDPOINT}/${id}`);
    return mergeCustomerEnhancement(normalizeCustomer(response));
  },

  async update(id: string, customerData: UpdateCustomerData): Promise<Customer> {
    const payload = { id, ...buildCustomerPayload(customerData) };
    const response = await apiClient.put<unknown>(CUSTOMERS_ENDPOINT, payload);
    return mergeCustomerEnhancement(normalizeCustomer(response));
  }
};
