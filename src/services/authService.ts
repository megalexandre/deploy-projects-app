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
  profile?: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

interface BackendLoginResponse {
  token: string;
  type?: string;
  expiresIn?: number;
}

interface BackendCurrentUserResponse {
  userId: string;
  email: string;
  authorities?: Array<{ authority?: string }>;
}

interface BackendRegisterResponse {
  id: string;
  name: string;
  email: string;
  profile: string;
}

const useMockApi = (import.meta.env.VITE_USE_MOCK_API as string | undefined)?.trim().toLowerCase() === 'true';
const STORAGE_USER_KEY = 'user';
const mockUser: User = {
  id: 'mock-admin',
  name: 'Admin OPJ',
  email: 'admin@opjengenharia.com.br',
  role: 'admin'
};

const persistUser = (user: User) => {
  localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
};

const clearPersistedSession = () => {
  localStorage.removeItem(STORAGE_USER_KEY);
  apiClient.setToken(null);
};

const normalizeRole = (authorities?: BackendCurrentUserResponse['authorities']) => {
  const authority = authorities?.find((item) => typeof item?.authority === 'string')?.authority;
  return authority ? authority.replace(/^ROLE_/i, '').toLowerCase() : undefined;
};

const mapBackendCurrentUser = (response: BackendCurrentUserResponse): User => ({
  id: response.userId,
  name: response.email,
  email: response.email,
  role: normalizeRole(response.authorities)
});

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
      persistUser(response.user);
      return response;
    }

    const loginResponse = await apiClient.post<BackendLoginResponse>('/auth/login', credentials);
    apiClient.setToken(loginResponse.token);

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Nao foi possivel carregar os dados do usuario autenticado.');
      }

      persistUser(currentUser);

      return {
        user: currentUser,
        token: loginResponse.token
      };
    } catch (error) {
      clearPersistedSession();
      throw error;
    }
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
      persistUser(response.user);
      return response;
    }

    const registerPayload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      profile: userData.profile ?? 'ADMIN'
    };

    await apiClient.post<BackendRegisterResponse>('/auth/register', registerPayload);
    return authService.login({
      email: userData.email,
      password: userData.password
    });
  },

  async logout(): Promise<void> {
    clearPersistedSession();
  },

  async getCurrentUser(): Promise<User | null> {
    if (useMockApi) {
      return mockUser;
    }

    try {
      const response = await apiClient.get<BackendCurrentUserResponse>('/auth/me');
      return mapBackendCurrentUser(response);
    } catch {
      return null;
    }
  }
};
