/** Camada de acesso a dados para 'servicosService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Servico } from '../types';
import { createCrudService } from './crudService';

export type CreateServicoPayload = Omit<Servico, 'id'>;
export type UpdateServicoPayload = Partial<CreateServicoPayload>;

export const servicosService = createCrudService<Servico, CreateServicoPayload, UpdateServicoPayload>('/servicos');
