import { asString, isRecord } from '@/core/utils/normalize';
import { apiClient } from '@/shared/api/apiClient';

export interface Concessionaria {
  id: string;
  name: string;
}

export interface SaveConcessionariaData {
  name: string;
}

const COMPANY_ENDPOINT = '/concessionaires';

const normalizeConcessionaria = (raw: unknown): Concessionaria => {
  const company = isRecord(raw) ? raw : {};

  return {
    id: asString(company.id),
    name: asString(company.name) || asString(company.nome)
  };
};

const sortByName = (items: Concessionaria[]) =>
  [...items].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));

const toList = (response: unknown): Concessionaria[] => {
  const data = Array.isArray(response)
    ? response
    : isRecord(response) && Array.isArray(response.data)
      ? response.data
      : [];

  return sortByName(data.map(normalizeConcessionaria));
};

export const concessionariasService = {
  
  async getAll(): Promise<Concessionaria[]> {
    const response = await apiClient.get<unknown[] | { data?: unknown[] }>(COMPANY_ENDPOINT);
    return toList(response);
  },

  async create(data: SaveConcessionariaData): Promise<Concessionaria> {
    const response = await apiClient.post<unknown>(COMPANY_ENDPOINT, {
      name: data.name.trim()
    });
    return normalizeConcessionaria(response);
  },

  async update(id: string, data: SaveConcessionariaData): Promise<Concessionaria> {
    const response = await apiClient.put<unknown>(`${COMPANY_ENDPOINT}/${id}`, {
      id,
      name: data.name.trim()
    });
    return normalizeConcessionaria(response);
  }
};
