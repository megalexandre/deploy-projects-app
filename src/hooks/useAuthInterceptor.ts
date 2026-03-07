/** Hook personalizado 'useAuthInterceptor': concentra logica reutilizavel de estado e efeitos. */
import { useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../services/apiClient';

export const useAuthInterceptor = () => {
  const refreshToken = useCallback(async () => {
    try {
      // Implemente aqui a lógica de refresh token se necessário
      // const response = await apiClient.post<{ token: string }>('/auth/refresh');
      // apiClient.setToken(response.token);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      apiClient.setToken(null);
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    // Configurar interceptor para 401 responses
    const originalGet = apiClient.get;
    const originalPost = apiClient.post;
    const originalPut = apiClient.put;
    const originalPatch = apiClient.patch;
    const originalDelete = apiClient.delete;
    
    const handle401 = async (error: unknown) => {
      if (error instanceof ApiError && error.status === 401) {
        await refreshToken();
      }
      throw error;
    };

    apiClient.get = async <T,>(path: string, options?: any) => {
      try {
        return await originalGet<T>(path, options);
      } catch (error) {
        return handle401(error);
      }
    };

    apiClient.post = async <T,>(path: string, body?: unknown, options?: any) => {
      try {
        return await originalPost<T>(path, body, options);
      } catch (error) {
        return handle401(error);
      }
    };

    apiClient.put = async <T,>(path: string, body?: unknown, options?: any) => {
      try {
        return await originalPut<T>(path, body, options);
      } catch (error) {
        return handle401(error);
      }
    };

    apiClient.patch = async <T,>(path: string, body?: unknown, options?: any) => {
      try {
        return await originalPatch<T>(path, body, options);
      } catch (error) {
        return handle401(error);
      }
    };

    apiClient.delete = async <T,>(path: string, options?: any) => {
      try {
        return await originalDelete<T>(path, options);
      } catch (error) {
        return handle401(error);
      }
    };

    return () => {
      apiClient.get = originalGet;
      apiClient.post = originalPost;
      apiClient.put = originalPut;
      apiClient.patch = originalPatch;
      apiClient.delete = originalDelete;
    };
  }, [refreshToken]);
};
