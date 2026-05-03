/** Camada de acesso a dados para 'auditService': concentra chamadas HTTP e transformacao basica de payloads. */
import { apiClient } from './apiClient';

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditFilters {
  userId?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | null | undefined;
}

export const auditService = {
  async getAll(filters?: AuditFilters): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>('/audit', { query: filters });
  },

  async getById(id: string): Promise<AuditLog> {
    return apiClient.get<AuditLog>(`/audit/${id}`);
  },

  async getByEntity(entity: string, entityId: string): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>(`/audit/entity/${entity}/${entityId}`);
  },

  async getByUser(userId: string, filters?: Omit<AuditFilters, 'userId'>): Promise<AuditLog[]> {
    return apiClient.get<AuditLog[]>(`/audit/user/${userId}`, { query: filters });
  }
};
