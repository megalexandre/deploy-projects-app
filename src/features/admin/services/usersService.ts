/** Camada de acesso a dados para 'usersService': concentra chamadas HTTP e transformacao basica de payloads. */
import { asString, isRecord } from '@/core/utils/normalize';
import { apiClient } from '@/shared/api/apiClient';
import { getSessionUser } from '@/shared/session/sessionUser';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
  role?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
}

const normalizeRole = (value?: string) => value?.trim().toLowerCase() || 'user';

const normalizeUser = (raw: unknown): User => {
  const user = isRecord(raw) ? raw : {};

  return {
    id: asString(user.id) || crypto.randomUUID(),
    name: asString(user.name) || asString(user.nome) || asString(user.email),
    email: asString(user.email),
    role: normalizeRole(asString(user.role) || asString(user.profile) || undefined),
    createdAt: asString(user.createdAt) || asString(user.created_at) || undefined,
    updatedAt: asString(user.updatedAt) || asString(user.updated_at) || undefined,
  };
};

export const usersService = {
  async create(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post<{ user?: unknown }>('/auth/register', {
      name: userData.name.trim(),
      email: userData.email.trim().toLowerCase(),
      password: userData.password,
      password_confirmation: userData.passwordConfirmation ?? userData.password,
      profile: normalizeRole(userData.role),
    });

    return normalizeUser(response.user);
  },

  async getAll(): Promise<User[]> {
    const response = await apiClient.get<unknown[]>('/auth/users');
    const users = Array.isArray(response) ? response.map(normalizeUser) : [];
    const sessionUser = getSessionUser();

    if (!sessionUser || sessionUser.isAdmin) {
      return users;
    }

    return users.filter((user) => user.id === sessionUser.id);
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async update(id: string, userData: UpdateUserData): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, userData);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  },
};
