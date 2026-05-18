import type { Projeto } from '@/types';

interface UseIdentifierProps {
  project: Projeto;
  isAdmin: boolean;
}

export const useIdentifier = ({ project, isAdmin }: UseIdentifierProps): string => {
  const { sequence, subsequente, protocolo: protocol } = project;

  if (!isAdmin) {
    return protocol;
  }

  if (!subsequente) {
    return `${sequence}`;
  }

  return `${sequence}/${subsequente}`;
};
