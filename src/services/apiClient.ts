type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || 'http://localhost:3000/api';
const STORAGE_TOKEN_KEY = (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';

const buildUrl = (path: string, query?: ApiRequestOptions['query']) => {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
};

const getStoredToken = () => localStorage.getItem(STORAGE_TOKEN_KEY);

const resolveErrorMessage = (payload: unknown, fallback: string) => {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const raw = (payload as { message?: unknown }).message;
    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }
  }
  return fallback;
};

const request = async <T>(method: HttpMethod, path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path, options.query), {
    ...options,
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(
      resolveErrorMessage(payload, 'Erro na comunicação com o servidor'),
      response.status,
      payload
    );
  }

  return payload as T;
};

export const apiClient = {
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options),
  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  },
  getToken: getStoredToken,
  baseUrl: API_BASE_URL
};
