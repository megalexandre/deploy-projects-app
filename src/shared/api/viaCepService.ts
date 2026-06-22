import { onlyDigits } from '@/core/utils/masks';
import { ENV } from '@/shared/config/env';

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

if (!ENV.VIACEP_BASE_URL) {
  throw new Error('Variavel de ambiente obrigatoria ausente: VITE_VIACEP_BASE_URL');
}
const VIACEP_BASE_URL = ENV.VIACEP_BASE_URL.replace(/\/+$/, '');

export const viaCepService = {
  async lookup(cep: string): Promise<ViaCepAddress | null> {
    const normalizedCep = onlyDigits(cep);
    if (normalizedCep.length !== 8) {
      return null;
    }

    const response = await fetch(`${VIACEP_BASE_URL}/${normalizedCep}/json/`);
    if (!response.ok) {
      throw new Error('Falha ao consultar CEP.');
    }

    const data = (await response.json()) as ViaCepResponse;
    if (data.erro) {
      return null;
    }

    return {
      cep: data.cep ?? normalizedCep,
      logradouro: data.logradouro ?? '',
      complemento: data.complemento ?? '',
      bairro: data.bairro ?? '',
      cidade: data.localidade ?? '',
      estado: data.uf ?? '',
    };
  },
};
