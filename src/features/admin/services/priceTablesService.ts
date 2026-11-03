import { apiClient } from '@/shared/api/apiClient';
import { getAllPages } from '@/shared/api/pagination';
import { clearAllRequestCaches } from '@/shared/api/requestCache';

export type PriceTableKind = 'fotovoltaico' | 'padrao_entrada' | 'cupom_projeto' | 'cupom_servico';

export interface PriceTableResponse {
  id: string;
  kind: PriceTableKind;
  name: string;
  values: unknown[];
}

type PriceTablePayload = Pick<PriceTableResponse, 'kind' | 'name' | 'values'>;

export const priceTablesService = {
  getAll: () => getAllPages<PriceTableResponse>('/price_tables'),

  async remove(id: string) {
    await apiClient.delete(`/price_tables/${id}`);
    clearAllRequestCaches();
  },

  create: (payload: PriceTablePayload) =>
    apiClient.post<PriceTableResponse>('/price_tables', payload),

  update: (id: string, payload: PriceTablePayload) =>
    apiClient.patch<PriceTableResponse>(`/price_tables/${id}`, payload),

  async upsert(payload: PriceTablePayload, current?: PriceTableResponse) {
    return current ? this.update(current.id, payload) : this.create(payload);
  },
};
