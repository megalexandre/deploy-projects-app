import type { Evento } from '../types';
import { createCrudService } from './crudService';

export type CreateEventoPayload = Omit<Evento, 'id'>;
export type UpdateEventoPayload = Partial<CreateEventoPayload>;

export const calendarioService = createCrudService<Evento, CreateEventoPayload, UpdateEventoPayload>('/calendario/eventos');
