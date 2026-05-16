import { apiClient } from '@/shared/api/apiClient';
import { ENDPOINTS } from '@/shared/config/endpoints';
import { Concessionaire, type ConcessionaireData } from '../domain/concessionaire';

export interface ConcessionaireInput {
  name: string;
  acronym: string;
  code: string;
  region: string;
  phone: string;
  email: string;
  active: boolean;
  logo: string | null;
}

class ConcessionairesService {
  async getAll(): Promise<Concessionaire[]> {
    const data = await apiClient.get<ConcessionaireData[]>(ENDPOINTS.concessionaires);
    return data.map((raw) => new Concessionaire(raw));
  }

  async create(input: ConcessionaireInput): Promise<Concessionaire> {
    const raw = await apiClient.post<ConcessionaireData>(ENDPOINTS.concessionaires, input);
    return new Concessionaire(raw);
  }

  async update(id: string, input: ConcessionaireInput): Promise<Concessionaire> {
    const raw = await apiClient.put<ConcessionaireData>(`${ENDPOINTS.concessionaires}/${id}`, input);
    return new Concessionaire(raw);
  }
}

export const concessionairesService = new ConcessionairesService();
