/** Camada de acesso a dados para 'authService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { User } from './usersService';
import { apiClient } from './apiClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

const useMockApi = (import.meta.env.VITE_USE_MOCK_API as string | undefined)?.trim().toLowerCase() === 'true';
const mockUser: User = {
  id: 'mock-admin',
  name: 'Admin OPJ',
  email: 'admin@opjengenharia.com.br',
  role: 'admin'
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (useMockApi) {
      const isDemoUser =
        credentials.email.trim().toLowerCase() === 'admin@opjengenharia.com.br' &&
        credentials.password === 'admin123';

      if (!isDemoUser) {
        throw new Error('Credenciais invalidas. Use admin@opjengenharia.com.br / admin123');
      }

      const response: LoginResponse = {
        user: mockUser,
        token: 'mock-auth-token'
      };
      apiClient.setToken(response.token);
      return response;
    }

    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  },

  async register(userData: RegisterData): Promise<LoginResponse> {
    if (useMockApi) {
      const response: LoginResponse = {
        user: {
          id: crypto.randomUUID(),
          name: userData.name,
          email: userData.email,
          role: 'admin'
        },
        token: 'mock-auth-token'
      };
      apiClient.setToken(response.token);
      return response;
    }

    const response = await apiClient.post<LoginResponse>('/auth/register', userData);
    
    if (response.token) {
      apiClient.setToken(response.token);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    if (useMockApi) {
      apiClient.setToken(null);
      return;
    }

    try {
      await apiClient.post('/auth/logout');
    } finally {
      apiClient.setToken(null);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    if (useMockApi) {
      return mockUser;
    }

    try {
      return await apiClient.get<User>('/auth/me');
    } catch {
      return null;
    }
  }
};
