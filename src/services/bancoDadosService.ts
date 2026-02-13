import type { Backup, DatabaseTable } from '../types';
import { apiClient } from './apiClient';

export interface DatabaseStatus {
  conexao: 'ativa' | 'instavel' | 'offline';
  performance: 'otima' | 'boa' | 'degradada';
  ultimaOtimizacao: string;
}

export const bancoDadosService = {
  listTables: () => apiClient.get<DatabaseTable[]>('/database/tables'),
  getStatus: () => apiClient.get<DatabaseStatus>('/database/status'),
  optimize: () => apiClient.post<{ message: string }>('/database/optimize'),
  listBackups: () => apiClient.get<Backup[]>('/database/backups'),
  createBackup: () => apiClient.post<Backup>('/database/backups'),
  restoreBackup: (id: string) => apiClient.post<{ message: string }>(`/database/backups/${id}/restore`),
  deleteBackup: async (id: string) => {
    await apiClient.delete(`/database/backups/${id}`);
  }
};
