import { apiClient } from '@/shared/api/apiClient';
import { toProjeto, type ProjectResponse } from '../domain/project';
import { toCustomer, type CustomerResponse } from '../domain/customer';
import { toAddress, type AddressResponse } from '../domain/address';
import type { Projeto } from '@/core/entities/projeto';

const PROJECTS_ENDPOINT = '/projects';
const CUSTOMERS_ENDPOINT = '/customers';
const ADDRESSES_ENDPOINT = '/addresses';

//#TODO:
// to fazendo isso enquanto não REescrevo No service.
// mas acho que da pra fazer tudo voltar no /project
export const projectsResource = {
  async getById(id: string): Promise<Projeto> {
    const projectResponse = await apiClient.get<ProjectResponse>(`${PROJECTS_ENDPOINT}/${id}`);

    const [customerResponse, addressResponse] = await Promise.all([
      apiClient.get<CustomerResponse>(`${CUSTOMERS_ENDPOINT}/${projectResponse.client_id}`),
      apiClient.get<AddressResponse>(`${ADDRESSES_ENDPOINT}/${projectResponse.address_id}`),
    ]);

    return toProjeto(projectResponse, toCustomer(customerResponse), toAddress(addressResponse));
  },
};
