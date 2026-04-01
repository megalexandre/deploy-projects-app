/** Hook personalizado 'useAuthInterceptor': registra tratamento global para sessao expirada. */
import { useEffect } from 'react';
import { apiClient, ApiError } from '../services/apiClient';

export const useAuthInterceptor = () => {
  useEffect(() => {
    apiClient.setUnauthorizedHandler((error) => {
      if (!(error instanceof ApiError) || error.status !== 401) {
        return;
      }

      window.location.replace('/login');
    });

    return () => {
      apiClient.setUnauthorizedHandler(null);
    };
  }, []);
};
