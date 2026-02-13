import type { User, LoginCredentials } from '../types';
import { apiClient } from './apiClient';

const mockUser: User = {
  id: '1',
  name: 'Administrador OPJ',
  email: 'admin@opjengenharia.com.br',
  role: 'admin'
};

const useMockApi = (import.meta.env.VITE_USE_MOCK_API as string | undefined) !== 'false';

interface LoginResponse {
  user: User;
  token?: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    if (!useMockApi) {
      const response = await apiClient.post<LoginResponse | User>('/auth/login', credentials);

      if ('user' in response) {
        if (response.token) {
          apiClient.setToken(response.token);
        }
        return response.user;
      }

      return response;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (credentials.email === 'admin@opjengenharia.com.br' && credentials.password === 'admin123') {
          resolve(mockUser);
        } else {
          reject(new Error('Credenciais inválidas'));
        }
      }, 1000);
    });
  },

  async logout(): Promise<void> {
    if (!useMockApi) {
      try {
        await apiClient.post('/auth/logout');
      } finally {
        apiClient.setToken(null);
      }
      return;
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 500);
    });
  },

  async getCurrentUser(): Promise<User | null> {
    if (!useMockApi) {
      try {
        return await apiClient.get<User>('/auth/me');
      } catch {
        return null;
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
          resolve(JSON.parse(userData));
        } else {
          resolve(null);
        }
      }, 300);
    });
  }
};
