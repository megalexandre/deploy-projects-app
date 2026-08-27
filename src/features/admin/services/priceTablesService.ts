import { apiClient } from '@/shared/api/apiClient';

export type PriceTableKind = 'fotovoltaico' | 'padrao_entrada' | 'cupom_projeto' | 'cupom_servico';

export interface PriceTableResponse {
  id: string;
  kind: PriceTableKind;
  name: string;
  values: unknown[];
}

type PriceTablePayload = Pick<PriceTableResponse, 'kind' | 'name' | 'values'>;

export const priceTablesService = {
  getAll: () => apiClient.get<PriceTableResponse[]>('/price_tables'),

  create: (payload: PriceTablePayload) =>
    apiClient.post<PriceTableResponse>('/price_tables', payload),

  update: (id: string, payload: PriceTablePayload) =>
    apiClient.patch<PriceTableResponse>(`/price_tables/${id}`, payload),

  async upsert(payload: PriceTablePayload, current?: PriceTableResponse) {
    return current ? this.update(current.id, payload) : this.create(payload);
  },
};
