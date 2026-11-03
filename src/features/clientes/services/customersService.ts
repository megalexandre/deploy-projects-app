/** Camada de acesso a dados para 'customersService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Documento } from '@/types';
import { asNumber, asString, isRecord } from '@/core/utils/normalize';
import { createRecordStorage } from '@/core/utils/storage';
import { apiClient } from '@/shared/api/apiClient';
import { getAllPages } from '@/shared/api/pagination';
import { filesService } from '@/shared/api/filesService';
import { clearAllRequestCaches } from '@/shared/api/requestCache';
import { createKeyedRequestCache, createRequestCache } from '@/shared/api/requestCache';
import type { CreateCustomerData, Customer, UpdateCustomerData } from '../domain/customer';
export type { CreateCustomerData, Customer, UpdateCustomerData } from '../domain/customer';

type CustomerEnhancement = {
  documentos?: Documento[];
};

const CUSTOMER_ENHANCEMENTS_STORAGE_KEY = 'opj_frontend_customer_enhancements';

const customerEnhancementsStorage = createRecordStorage<CustomerEnhancement>(
  CUSTOMER_ENHANCEMENTS_STORAGE_KEY,
);

const normalizeDocumentos = (documentos?: unknown): Documento[] =>
  (Array.isArray(documentos) ? documentos : []).map((item) => {
    const documento = isRecord(item) ? item : {};

    return {
      id: asString(documento.id) || crypto.randomUUID(),
      nome: asString(documento.nome) || asString(documento.name) || 'Documento',
      tipo: asString(documento.tipo) || asString(documento.type) || 'Documento',
      dataUpload:
        asString(documento.dataUpload) || asString(documento.createdAt) || new Date().toISOString(),
      tamanho: asNumber(documento.tamanho ?? documento.size),
      fileId: asString(documento.fileId) || asString(documento.id) || undefined,
      url: asString(documento.url) || asString(documento.urlS3) || undefined,
    };
  });

const updateCustomerEnhancement = (
  customerId: string,
  updater: (current: CustomerEnhancement | undefined) => CustomerEnhancement,
) => {
  const current = customerEnhancementsStorage.read();
  current[customerId] = updater(current[customerId]);
  customerEnhancementsStorage.write(current);
};

const mergeCustomerEnhancement = (customer: Customer): Customer => {
  const enhancement = customerEnhancementsStorage.read()[customer.id];
  if (!enhancement) {
    return customer;
  }

  return {
    ...customer,
    documentos: enhancement.documentos?.length ? enhancement.documentos : customer.documentos,
  };
};

const normalizeEndereco = (raw: unknown): Customer['endereco'] => {
  const endereco = isRecord(raw) ? raw : {};

  const cep = asString(endereco.cep);
  const logradouro =
    asString(endereco.logradouro) || asString(endereco.address) || asString(endereco.place);
  const numero = asString(endereco.numero) || asString(endereco.number);
  const complemento = asString(endereco.complemento) || asString(endereco.complement);
  const bairro = asString(endereco.bairro) || asString(endereco.neighborhood);
  const cidade = asString(endereco.cidade) || asString(endereco.city);
  const estado = asString(endereco.estado) || asString(endereco.state);
  const link = asString(endereco.link);

  const anyFilled = [cep, logradouro, numero, complemento, bairro, cidade, estado, link].some(
    (item) => item.trim() !== '',
  );
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
    link: link || undefined,
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
    createdBy: asString(customer.created_by) || undefined,
    addressId:
      asString(customer.address_id) || asString(customer.addressId) || nestedAddressId || undefined,
    nome: asString(customer.nome) || asString(customer.name),
    cpfCnpj: asString(customer.cpfCnpj) || asString(customer.tax_id) || asString(customer.taxId),
    telefone: asString(customer.telefone) || asString(customer.phone),
    email: asString(customer.email),
    enderecoCompleto: enderecoCompleto || undefined,
    endereco: normalizeEndereco(enderecoRaw),
    documentos: normalizeDocumentos(customer.documentos),
  };
};

const CUSTOMERS_ENDPOINT = '/customers';
const customersListCache = createRequestCache<Customer[]>(30_000);
const customerByIdCache = createKeyedRequestCache<Customer>(30_000);

const invalidateCustomerCache = (customerId?: string) => {
  customersListCache.invalidate();
  customerByIdCache.invalidate(customerId);
};

const buildCustomerPayload = (customerData: CreateCustomerData | UpdateCustomerData) => {
  const payload: Record<string, unknown> = {};

  if (customerData.nome !== undefined) {
    payload.name = customerData.nome;
    payload.nome = customerData.nome;
  }

  if (customerData.cpfCnpj !== undefined) {
    payload.tax_id = customerData.cpfCnpj;
    payload.cpfCnpj = customerData.cpfCnpj;
  }

  if (customerData.telefone !== undefined) {
    payload.phone = customerData.telefone;
    payload.telefone = customerData.telefone;
  }

  if (customerData.email !== undefined) {
    payload.email = customerData.email;
  }

  if (customerData.addressId !== undefined) {
    payload.address_id = customerData.addressId;
    payload.addressId = customerData.addressId;
  }

  return payload;
};

export const customersService = {
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${CUSTOMERS_ENDPOINT}/${id}`);
    const enhancements = customerEnhancementsStorage.read();
    delete enhancements[id];
    customerEnhancementsStorage.write(enhancements);
    clearAllRequestCaches();
  },

  async refreshDocuments(id: string): Promise<Customer> {
    const uploads = await filesService.listByItem(id);
    const documentos = uploads.map((file) => ({
      id: file.id,
      fileId: file.id,
      nome: file.fileName,
      tipo: 'Documento',
      dataUpload: file.createdAt ?? '',
      tamanho: file.size,
      url: file.urlS3,
    }));
    customersService.saveDocuments(id, documentos);
    const response = await apiClient.get<unknown>(`${CUSTOMERS_ENDPOINT}/${id}`);
    return {
      ...normalizeCustomer(response),
      documentos,
    };
  },
  saveDocuments(customerId: string, documentos: Documento[]) {
    updateCustomerEnhancement(customerId, (current) => ({
      ...current,
      documentos,
    }));
    invalidateCustomerCache(customerId);
  },

  async getAll(): Promise<Customer[]> {
    return customersListCache.get(async () => {
      const response = await getAllPages<unknown>(CUSTOMERS_ENDPOINT);
      return response.map(normalizeCustomer).map(mergeCustomerEnhancement);
    });
  },

  async create(customerData: CreateCustomerData): Promise<Customer> {
    const payload = buildCustomerPayload(customerData);
    const response = await apiClient.post<unknown>(CUSTOMERS_ENDPOINT, payload);
    const customer = mergeCustomerEnhancement(normalizeCustomer(response));
    invalidateCustomerCache(customer.id);
    return customer;
  },

  async getById(id: string): Promise<Customer> {
    return customerByIdCache.get(id, async () => {
      const response = await apiClient.get<unknown>(`${CUSTOMERS_ENDPOINT}/${id}`);
      return mergeCustomerEnhancement(normalizeCustomer(response));
    });
  },

  async update(id: string, customerData: UpdateCustomerData): Promise<Customer> {
    const payload = { id, ...buildCustomerPayload(customerData) };
    const response = await apiClient.put<unknown>(`${CUSTOMERS_ENDPOINT}/${id}`, payload);
    const customer = mergeCustomerEnhancement(normalizeCustomer(response));
    invalidateCustomerCache(id);
    return customer;
  },
};
