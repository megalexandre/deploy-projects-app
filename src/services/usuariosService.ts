/** Camada de acesso a dados para 'usuariosService': concentra chamadas HTTP e transformacao basica de payloads. */
import type { Usuario } from '../types';
import { createCrudService } from './crudService';

export type CreateUsuarioPayload = Omit<Usuario, 'id' | 'ultimoAcesso'>;
export type UpdateUsuarioPayload = Partial<Omit<Usuario, 'id'>>;

export const usuariosService = createCrudService<Usuario, CreateUsuarioPayload, UpdateUsuarioPayload>('/usuarios');
