import type { Transacao } from '../types';
import { apiClient } from './apiClient';
import { createCrudService } from './crudService';

export type CreateTransacaoPayload = Omit<Transacao, 'id'>;
export type UpdateTransacaoPayload = Partial<CreateTransacaoPayload>;

const transacoesCrud = createCrudService<Transacao, CreateTransacaoPayload, UpdateTransacaoPayload>('/financeiro/transacoes');

export interface ResumoFinanceiro {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  totalPendentes: number;
}

export const financeiroService = {
  ...transacoesCrud,
  getResumo: () => apiClient.get<ResumoFinanceiro>('/financeiro/resumo')
};
