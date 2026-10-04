import { apiClient } from '@/shared/api/apiClient';
import { createRequestCache } from '@/shared/api/requestCache';
import { ENDPOINTS } from '@/shared/config/endpoints';
import { Concessionaire, type ConcessionaireData } from '../domain/concessionaire';

const concessionairesCache = createRequestCache<Concessionaire[]>(30_000);

class ConcessionairesService {
  async getAll(): Promise<Concessionaire[]> {
    return concessionairesCache.get(async () => {
      const data = await apiClient.get<ConcessionaireData[]>(ENDPOINTS.concessionaires);
      return data.map((raw) => new Concessionaire(raw));
    });
  }

  async create(input: Omit<ConcessionaireData, 'id'>): Promise<Concessionaire> {
    const raw = await apiClient.post<ConcessionaireData>(ENDPOINTS.concessionaires, input);
    concessionairesCache.invalidate();
    return new Concessionaire(raw);
  }

  async update(id: string, input: Omit<ConcessionaireData, 'id'>): Promise<Concessionaire> {
    const raw = await apiClient.put<ConcessionaireData>(
      `${ENDPOINTS.concessionaires}/${id}`,
      input,
    );
    concessionairesCache.invalidate();
    return new Concessionaire(raw);
  }
}

export const concessionairesService = new ConcessionairesService();
