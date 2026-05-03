/** Hook personalizado 'useAuthInterceptor': registra tratamento global para sessao expirada. */
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient, ApiError } from '@/shared/api/apiClient';

export const useAuthInterceptor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    apiClient.setUnauthorizedHandler((error) => {
      if (!(error instanceof ApiError) || error.status !== 401) {
        return;
      }

      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    });

    return () => {
      apiClient.setUnauthorizedHandler(null);
    };
  }, [location.pathname, navigate]);
};
