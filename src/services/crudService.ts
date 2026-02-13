import type { ApiListParams, PaginatedResponse } from '../types';
import { apiClient } from './apiClient';

export interface CrudService<TEntity, TCreate, TUpdate = Partial<TCreate>> {
  list(params?: ApiListParams): Promise<TEntity[] | PaginatedResponse<TEntity>>;
  getById(id: string): Promise<TEntity>;
  create(payload: TCreate): Promise<TEntity>;
  update(id: string, payload: TUpdate): Promise<TEntity>;
  remove(id: string): Promise<void>;
}

export const createCrudService = <TEntity, TCreate, TUpdate = Partial<TCreate>>(
  resourcePath: string
): CrudService<TEntity, TCreate, TUpdate> => {
  const base = resourcePath.startsWith('/') ? resourcePath : `/${resourcePath}`;
  const toQueryRecord = (params?: ApiListParams) =>
    params as Record<string, string | number | boolean | undefined | null> | undefined;

  return {
    list: (params) => apiClient.get<TEntity[] | PaginatedResponse<TEntity>>(base, { query: toQueryRecord(params) }),
    getById: (id) => apiClient.get<TEntity>(`${base}/${id}`),
    create: (payload) => apiClient.post<TEntity>(base, payload),
    update: (id, payload) => apiClient.put<TEntity>(`${base}/${id}`, payload),
    remove: async (id) => {
      await apiClient.delete(`${base}/${id}`);
    }
  };
};
