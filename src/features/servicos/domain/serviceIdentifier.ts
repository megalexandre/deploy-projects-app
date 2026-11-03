import type { Servico } from '@/types';

export const serviceIdentifier = (service: Pick<Servico, 'protocolo' | 'subsequencia'>) =>
  service.subsequencia ? `${service.protocolo}/${service.subsequencia}` : service.protocolo;
