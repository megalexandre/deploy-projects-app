import { asString, isRecord } from '@/core/utils/normalize';
import { apiClient } from './apiClient';

export interface Address {
  id: string;
  cep: string;
  place: string;
  number: string;
  address: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  link?: string;
}

export interface CreateAddressData {
  cep: string;
  place: string;
  number: string;
  address: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  link?: string;
}

export interface UpdateAddressData extends CreateAddressData {
  id: string;
}

const ADDRESS_ENDPOINT = '/addresses';

const normalizeAddress = (raw: unknown): Address => {
  const address = isRecord(raw) ? raw : {};

  return {
    id: asString(address.id) || crypto.randomUUID(),
    cep: asString(address.cep),
    place: asString(address.place),
    number: asString(address.number),
    address: asString(address.address),
    complement: asString(address.complement) || undefined,
    neighborhood: asString(address.neighborhood),
    city: asString(address.city),
    state: asString(address.state),
    link: asString(address.link) || undefined,
  };
};

const buildMapsLink = (addressData: CreateAddressData | UpdateAddressData) => {
  const explicitLink = asString(addressData.link).trim();
  if (explicitLink) {
    return explicitLink;
  }

  const query = [
    asString(addressData.address).trim() || asString(addressData.place).trim(),
    asString(addressData.number).trim(),
    asString(addressData.neighborhood).trim(),
    asString(addressData.city).trim(),
    asString(addressData.state).trim(),
    asString(addressData.cep).trim(),
  ]
    .filter(Boolean)
    .join(', ');

  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
};

const buildAddressPayload = (addressData: CreateAddressData | UpdateAddressData) => {
  const payload: Record<string, unknown> = {
    place: asString(addressData.place).trim(),
    link: buildMapsLink(addressData),
    cep: asString(addressData.cep).trim(),
    number: asString(addressData.number).trim(),
    address: asString(addressData.address).trim(),
    complement: asString(addressData.complement).trim(),
    neighborhood: asString(addressData.neighborhood).trim(),
    city: asString(addressData.city).trim(),
    state: asString(addressData.state).trim(),
  };

  if ('id' in addressData) {
    payload.id = addressData.id;
  }

  return payload;
};

export const addressService = {
  async create(addressData: CreateAddressData): Promise<Address> {
    const response = await apiClient.post<unknown>(
      ADDRESS_ENDPOINT,
      buildAddressPayload(addressData),
    );
    return normalizeAddress(response);
  },

  async update(addressData: UpdateAddressData): Promise<Address> {
    const response = await apiClient.put<unknown>(
      ADDRESS_ENDPOINT,
      buildAddressPayload(addressData),
    );
    return normalizeAddress(response);
  },

  async getById(id: string): Promise<Address> {
    const response = await apiClient.get<unknown>(`${ADDRESS_ENDPOINT}/${id}`);
    return normalizeAddress(response);
  },
};
