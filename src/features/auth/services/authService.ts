/** Camada de acesso a dados para 'authService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { User } from '@/types';
import { apiClient } from '@/shared/api/apiClient';
import { clearSessionUser, setSessionUser } from '@/shared/session/sessionUser';

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
  id: string;
  name: string;
  email: string;
  profile?: string;
  created_at?: string;
  updated_at?: string;
}

interface BackendRegisterResponse {
  id: string;
  name: string;
  email: string;
  profile: string;
}

const clearPersistedSession = () => {
  clearSessionUser();
  apiClient.setToken(null);
};

const normalizeRole = (profile?: string) => {
  const normalized = profile?.trim().toLowerCase();
  return normalized || 'user';
};

const isAdminRole = (role: string) => role === 'admin' || role === 'main';

const mapBackendCurrentUser = (response: BackendCurrentUserResponse): User => ({
  id: response.id,
  name: response.name,
  email: response.email,
  role: normalizeRole(response.profile),
  isAdmin: isAdminRole(normalizeRole(response.profile))
});

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const loginResponse = await apiClient.post<BackendLoginResponse>('/auth/login', credentials);
    apiClient.setToken(loginResponse.token);

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('Nao foi possivel carregar os dados do usuario autenticado.');
      }

      setSessionUser(currentUser);

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
    const registerPayload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      profile: userData.profile ?? 'admin'
    };

    // @todo change all rotes do proper path and remove this endpoint
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
    try {
      const response = await apiClient.get<BackendCurrentUserResponse>('/auth/me');
      return mapBackendCurrentUser(response);
    } catch {
      return null;
    }
  }
};
