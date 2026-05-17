import { apiClient } from '@/shared/api/apiClient';
import { ENDPOINTS } from '@/shared/config/endpoints';
import { Concessionaire, type ConcessionaireData } from '../domain/concessionaire';

class ConcessionairesService {

  async getAll(): Promise<Concessionaire[]> {
    const data = await apiClient.get<ConcessionaireData[]>(ENDPOINTS.concessionaires);










    return data.map((raw) =>
      
      
      
      
      
      
      
      
      new Concessionaire(raw));
  }

  async create(input: Omit<ConcessionaireData, 'id'>): Promise<Concessionaire> {
    const raw = await apiClient.post<ConcessionaireData>(ENDPOINTS.concessionaires, input);
    return new Concessionaire(raw);
  }

  async update(id: string, input: Omit<ConcessionaireData, 'id'>): Promise<Concessionaire> {
    const raw = await apiClient.put<ConcessionaireData>(`${ENDPOINTS.concessionaires}/${id}`, input);
    return new Concessionaire(raw);
  }
}

export const concessionairesService = new ConcessionairesService();
