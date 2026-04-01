/** Camada de acesso a dados para 'index': concentra chamadas HTTP e transformacao basica de payloads. */
export { apiClient, ApiError } from './apiClient';
export type { ApiRequestOptions } from './apiClient';

// New API services
export { authService } from './authService';
export { usersService } from './usersService';
export { projectsService } from './projectsService';
export { customersService } from './customersService';
export { addressService } from './addressService';
export { auditService } from './auditService';
export { concessionariasService } from './concessionariasService';
export { viaCepService } from './viaCepService';

// Export types for new services
export type { 
  LoginCredentials, 
  RegisterData, 
  LoginResponse 
} from './authService';

export type { 
  User, 
  CreateUserData, 
  UpdateUserData 
} from './usersService';

export type { 
  Project, 
  CreateProjectData, 
  UpdateProjectData 
} from './projectsService';

export type {
  Customer,
  CreateCustomerData,
  UpdateCustomerData
} from './customersService';

export type {
  Address,
  CreateAddressData,
  UpdateAddressData
} from './addressService';

export type { 
  AuditLog, 
  AuditFilters 
} from './auditService';

export type {
  Concessionaria,
  SaveConcessionariaData
} from './concessionariasService';

// Legacy services (keep if needed)
export { createCrudService } from './crudService';
export type { CrudService } from './crudService';
export { usuariosService } from './usuariosService';
export { servicosService } from './servicosService';
export { financeiroService } from './financeiroService';
export { calendarioService } from './calendarioService';
export { configuracoesService } from './configuracoesService';
export { bancoDadosService } from './bancoDadosService';
