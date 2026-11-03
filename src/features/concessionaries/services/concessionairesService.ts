import { apiClient } from '@/shared/api/apiClient';
import { getAllPages } from '@/shared/api/pagination';
import { clearAllRequestCaches } from '@/shared/api/requestCache';
import { createRequestCache } from '@/shared/api/requestCache';
import { ENDPOINTS } from '@/shared/config/endpoints';
import { Concessionaire, type ConcessionaireData } from '../domain/concessionaire';

const concessionairesCache = createRequestCache<Concessionaire[]>(30_000);

class ConcessionairesService {
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${ENDPOINTS.concessionaires}/${id}`);
    clearAllRequestCaches();
  }
  async getAll(): Promise<Concessionaire[]> {
    return concessionairesCache.get(async () => {
      const data = await getAllPages<ConcessionaireData>(ENDPOINTS.concessionaires);
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
