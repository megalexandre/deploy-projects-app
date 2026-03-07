/** Camada de acesso a dados para 'usersService': concentra chamadas HTTP e transformacao basica de payloads. */
import { apiClient } from './apiClient';

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
  role?: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
}

export const usersService = {
  async create(userData: CreateUserData): Promise<User> {
    return apiClient.post<User>('/users', userData);
  },

  async getAll(): Promise<User[]> {
    return apiClient.get<User[]>('/users');
  },

  async getById(id: string): Promise<User> {
    return apiClient.get<User>(`/users/${id}`);
  },

  async update(id: string, userData: UpdateUserData): Promise<User> {
    return apiClient.put<User>(`/users/${id}`, userData);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/users/${id}`);
  }
};
