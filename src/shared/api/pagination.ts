import { apiClient } from './apiClient';

export interface ApiPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
}

export const getPage = <T>(endpoint: string, page = 1, limit = 100) =>
  apiClient.get<ApiPage<T>>(`${endpoint}/paginate`, { query: { page, limit } });

// The API does not yet support search/filter parameters on these resources.
// Collect every page before applying global filters or building Kanban totals.
export async function getAllPages<T>(endpoint: string): Promise<T[]> {
  const first = await getPage<T>(endpoint);
  if (
    !Array.isArray(first.content) ||
    !Number.isInteger(first.totalPages) ||
    first.totalPages < 0
  ) {
    throw new Error('Resposta de paginação inválida. Tente carregar novamente.');
  }
  const result = [...first.content];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await getPage<T>(endpoint, page);
    if (!Array.isArray(next.content)) throw new Error('Resposta de paginação inválida.');
    result.push(...next.content);
  }
  return result;
}
