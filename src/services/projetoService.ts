import type { Projeto, DashboardStats, PaginatedResponse } from '../types';
import { projetosMock } from '../mocks/projetos';
import { apiClient } from './apiClient';
import { createCrudService } from './crudService';

type CreateProjetoPayload = Omit<Projeto, 'id' | 'dataCriacao' | 'dataAtualizacao'>;
type UpdateProjetoPayload = Partial<CreateProjetoPayload>;

const useMockApi = (import.meta.env.VITE_USE_MOCK_API as string | undefined) !== 'false';
const projetosCrud = createCrudService<Projeto, CreateProjetoPayload, UpdateProjetoPayload>('/projetos');

const extractDataFromList = (response: Projeto[] | PaginatedResponse<Projeto>) => {
  if (Array.isArray(response)) {
    return response;
  }
  return response.data;
};

export const projetoService = {
  async getProjetos(): Promise<Projeto[]> {
    if (!useMockApi) {
      const response = await projetosCrud.list();
      return extractDataFromList(response);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(projetosMock);
      }, 800);
    });
  },

  async getProjetoById(id: string): Promise<Projeto | null> {
    if (!useMockApi) {
      try {
        return await projetosCrud.getById(id);
      } catch {
        return null;
      }
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const projeto = projetosMock.find(p => p.id === id);
        resolve(projeto || null);
      }, 500);
    });
  },

  async createProjeto(projeto: CreateProjetoPayload): Promise<Projeto> {
    if (!useMockApi) {
      return projetosCrud.create(projeto);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const newProjeto: Projeto = {
          ...projeto,
          id: Date.now().toString(),
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString()
        };
        resolve(newProjeto);
      }, 1000);
    });
  },

  async updateProjeto(id: string, projeto: UpdateProjetoPayload): Promise<Projeto> {
    if (!useMockApi) {
      return projetosCrud.update(id, projeto);
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingProjeto = projetosMock.find(p => p.id === id);
        if (!existingProjeto) {
          reject(new Error('Projeto não encontrado'));
          return;
        }
        
        const updatedProjeto: Projeto = {
          ...existingProjeto,
          ...projeto,
          dataAtualizacao: new Date().toISOString()
        };
        resolve(updatedProjeto);
      }, 800);
    });
  },

  async deleteProjeto(id: string): Promise<void> {
    if (!useMockApi) {
      await projetosCrud.remove(id);
      return;
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const projeto = projetosMock.find(p => p.id === id);
        if (!projeto) {
          reject(new Error('Projeto não encontrado'));
          return;
        }
        resolve();
      }, 500);
    });
  },

  async getDashboardStats(): Promise<DashboardStats> {
    if (!useMockApi) {
      return apiClient.get<DashboardStats>('/projetos/dashboard/stats');
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const stats: DashboardStats = {
          totalProjetos: projetosMock.length,
          projetosEmAndamento: projetosMock.filter(p => p.status === 'em_andamento').length,
          projetosFinalizados: projetosMock.filter(p => p.status === 'concluido').length,
          projetosPendentes: projetosMock.filter(p => p.status === 'pendente').length
        };
        resolve(stats);
      }, 600);
    });
  },

  list: projetosCrud.list,
  getById: projetosCrud.getById,
  create: projetosCrud.create,
  update: projetosCrud.update,
  remove: projetosCrud.remove
};
