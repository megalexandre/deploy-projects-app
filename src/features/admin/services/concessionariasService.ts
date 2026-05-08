import { asString, isRecord } from '@/core/utils/normalize';
import { createArrayStorage } from '@/core/utils/storage';
import { apiClient } from '@/shared/api/apiClient';

export interface Concessionaria {
  id: string;
  nome: string;
}

export interface SaveConcessionariaData {
  nome: string;
}

const COMPANY_ENDPOINT = '/concessionaires';
const concessionariasStorage = createArrayStorage<Concessionaria>('opj_shared_concessionarias');

const normalizeConcessionaria = (raw: unknown): Concessionaria => {
  const company = isRecord(raw) ? raw : {};

  return {
    id: asString(company.id) || crypto.randomUUID(),
    nome: asString(company.nome) || asString(company.name)
  };
};

const sortByName = (items: Concessionaria[]) =>
  [...items].sort((left, right) => left.nome.localeCompare(right.nome, 'pt-BR'));

const mergeConcessionarias = (items: Concessionaria[]) => {
  const merged = new Map<string, Concessionaria>();

  items
    .filter((item) => item.nome.trim() !== '')
    .forEach((item) => {
      const normalizedName = item.nome.trim().toLowerCase();
      const key = item.id || normalizedName;
      const existingByName = Array.from(merged.values()).find(
        (current) => current.nome.trim().toLowerCase() === normalizedName
      );

      if (existingByName) {
        merged.set(existingByName.id, {
          ...existingByName,
          ...item,
          id: existingByName.id || item.id
        });
        return;
      }

      merged.set(key, item);
    });

  return sortByName(Array.from(merged.values()));
};

const persistSharedConcessionarias = (items: Concessionaria[]) => {
  concessionariasStorage.write(mergeConcessionarias(items));
};

const readSharedConcessionarias = () => mergeConcessionarias(concessionariasStorage.read());

export const concessionariasService = {
  async getAll(): Promise<Concessionaria[]> {
    const shared = readSharedConcessionarias();

    try {
      const response = await apiClient.get<unknown[] | { data?: unknown[] }>(COMPANY_ENDPOINT);
      const data =
        Array.isArray(response)
          ? response
          : isRecord(response) && Array.isArray(response.data)
            ? response.data
            : [];
      const merged = mergeConcessionarias([...shared, ...data.map(normalizeConcessionaria)]);

      persistSharedConcessionarias(merged);
      return merged;
    } catch (error) {
      if (shared.length > 0) {
        return shared;
      }

      throw error;
    }
  },

  async getActive(): Promise<Concessionaria[]> {
    return concessionariasService.getAll();
  },

  async create(data: SaveConcessionariaData): Promise<Concessionaria> {
    const response = await apiClient.post<unknown>(COMPANY_ENDPOINT, {
      name: data.nome.trim()
    });
    const concessionaria = normalizeConcessionaria(response);
    persistSharedConcessionarias([...readSharedConcessionarias(), concessionaria]);
    return concessionaria;
  },

  async update(id: string, data: SaveConcessionariaData): Promise<Concessionaria> {
    const response = await apiClient.put<unknown>(`${COMPANY_ENDPOINT}/${id}`, {
      id,
      name: data.nome.trim()
    });
    const concessionaria = normalizeConcessionaria(response);
    persistSharedConcessionarias(
      readSharedConcessionarias().map((item) => (item.id === id ? concessionaria : item))
    );
    return concessionaria;
  }
};
