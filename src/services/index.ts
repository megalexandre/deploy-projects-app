/** Camada de acesso a dados para 'index': concentra chamadas HTTP e transformacao basica de payloads. */
export { apiClient, ApiError } from '@/shared/api/apiClient';
export type { ApiRequestOptions } from '@/shared/api/apiClient';

// New API services
export { authService } from '@/features/auth/services/authService';
export { usersService } from '@/features/admin/services/usersService';
export { projectsService } from '@/features/projetos/services/projectsService';
export { customersService } from '@/features/clientes/services/customersService';
export { addressService } from '@/shared/api/addressService';
export { auditService } from '@/shared/api/auditService';
export { concessionariasService } from '@/features/admin/services/concessionariasService';
export { viaCepService } from '@/shared/api/viaCepService';
export { filesService } from '@/shared/api/filesService';

// Export types for new services
export type { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse 
} from '@/features/auth/services/authService';

export type { 
  User, 
  CreateUserData, 
  UpdateUserData 
} from '@/features/admin/services/usersService';

export type { 
  Project, 
  CreateProjectData, 
  UpdateProjectData 
} from '@/features/projetos/services/projectsService';

export type {
  Customer,
  CreateCustomerData,
  UpdateCustomerData
} from '@/features/clientes/services/customersService';

export type {
  Address,
  CreateAddressData,
  UpdateAddressData
} from '@/shared/api/addressService';

export type { 
  AuditLog, 
  AuditFilters 
} from '@/shared/api/auditService';

export type {
  Concessionaria,
  SaveConcessionariaData
} from '@/features/admin/services/concessionariasService';
export type { UploadedFileResponse } from '@/shared/api/filesService';

// Legacy services (keep if needed)
export { createCrudService } from '@/shared/api/crudService';
export type { CrudService } from '@/shared/api/crudService';
export { usuariosService } from './usuariosService';
export { servicosService } from '@/features/servicos/services/servicosService';
export { financeiroService } from '@/features/financeiro/services/financeiroService';
export { calendarioService } from '@/features/calendario/services/calendarioService';
export { configuracoesService } from '@/features/admin/services/configuracoesService';
