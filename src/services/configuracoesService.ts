import type { ConfiguracoesSistema } from '../types';
import { apiClient } from './apiClient';

export const configuracoesService = {
  get: () => apiClient.get<ConfiguracoesSistema>('/configuracoes'),
  update: (payload: Partial<ConfiguracoesSistema>) =>
    apiClient.put<ConfiguracoesSistema>('/configuracoes', payload),
  reset: () => apiClient.post<ConfiguracoesSistema>('/configuracoes/reset')
};
