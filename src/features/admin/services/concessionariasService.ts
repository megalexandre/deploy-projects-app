import { asString, isRecord } from '@/core/utils/normalize';
import { apiClient } from '@/shared/api/apiClient';

export interface Concessionaria {
  id: string;
  nome: string;
}

export interface SaveConcessionariaData {
  nome: string;
}

const COMPANY_ENDPOINT = '/concessionaires';

const normalizeConcessionaria = (raw: unknown): Concessionaria => {
  const company = isRecord(raw) ? raw : {};

  return {
    id: asString(company.id) || crypto.randomUUID(),
    nome: asString(company.nome) || asString(company.name)
  };
};

const sortByName = (items: Concessionaria[]) =>
  [...items].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'));

export const concessionariasService = {
  async getAll(): Promise<Concessionaria[]> {
    const response = await apiClient.get<unknown[] | { data?: unknown[] }>(COMPANY_ENDPOINT);
    const data =
      Array.isArray(response)
        ? response
        : isRecord(response) && Array.isArray(response.data)
          ? response.data
          : [];

    return sortByName(data.map(normalizeConcessionaria).filter((item) => item.nome.trim() !== ''));
  },

  async getActive(): Promise<Concessionaria[]> {
    return concessionariasService.getAll();
  },

  async create(data: SaveConcessionariaData): Promise<Concessionaria> {
    const response = await apiClient.post<unknown>(COMPANY_ENDPOINT, {
      name: data.nome.trim()
    });

    return normalizeConcessionaria(response);
  },

  async update(id: string, data: SaveConcessionariaData): Promise<Concessionaria> {
    const response = await apiClient.put<unknown>(COMPANY_ENDPOINT, {
      id,
      name: data.nome.trim()
    });

    return normalizeConcessionaria(response);
  }
};
