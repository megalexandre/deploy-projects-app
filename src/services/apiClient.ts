/** Camada de acesso a dados para 'apiClient': concentra chamadas HTTP e transformacao basica de payloads. */
/** Metodos HTTP suportados pelo cliente interno. */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Opcoes customizadas para as requisicoes da API. */
export interface ApiRequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  /** Corpo da requisicao (sera serializado como JSON quando informado). */
  body?: unknown;
  /** Query params opcionais para compor a URL final. */
  query?: Record<string, string | number | boolean | undefined | null>;
}

/** Erro padronizado para respostas HTTP fora da faixa de sucesso (2xx). */
export class ApiError extends Error {
  /** Status HTTP devolvido pela API. */
  readonly status: number;
  /** Payload original do erro para facilitar debug e tratamento na UI. */
  readonly payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/** URL base da API, com fallback por ambiente. */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  (import.meta.env.DEV ? '/api' : 'https://project-deploy.shop');
/** Chave do localStorage onde o token de autenticacao e salvo. */
const STORAGE_TOKEN_KEY = (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';

/** Monta URL final, incluindo endpoint e query params validos. */
const buildUrl = (path: string, query?: ApiRequestOptions['query']) => {
  const endpoint = path.startsWith('/') ? path : `/${path}`;

  // Em desenvolvimento com proxy do Vite, usa URL relativa.
  if (import.meta.env.DEV && API_BASE_URL === '/api') {
    const url = `/api${endpoint}`;

    if (query) {
      const searchParams = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      return `${url}?${searchParams.toString()}`;
    }

    return url;
  }

  // Fora do proxy local, gera URL absoluta para chamadas remotas.
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

/** Recupera token persistido da sessao atual. */
const getStoredToken = () => localStorage.getItem(STORAGE_TOKEN_KEY);

/** Escolhe a melhor mensagem de erro possivel a partir do payload devolvido. */
const resolveErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const raw = (payload as { message?: unknown }).message;
    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }
  }

  if (payload && typeof payload === 'object' && 'error' in payload) {
    const raw = (payload as { error?: unknown }).error;
    if (typeof raw === 'string' && raw.trim()) {
      return raw;
    }
  }

  return fallback;
};

/** Executa requisicao HTTP com tratamento centralizado de headers, auth e erros. */
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
      resolveErrorMessage(payload, 'Erro na comunicacao com o servidor'),
      response.status,
      payload
    );
  }

  return payload as T;
};

/** Interface publica do cliente HTTP usada pelos demais services da aplicacao. */
export const apiClient = {
  /** Requisicoes de leitura. */
  get: <T>(path: string, options?: ApiRequestOptions) => request<T>('GET', path, options),
  /** Requisicoes de criacao. */
  post: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>) =>
    request<T>('POST', path, { ...options, body }),
  /** Requisicoes de atualizacao completa. */
  put: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>) =>
    request<T>('PUT', path, { ...options, body }),
  /** Requisicoes de atualizacao parcial. */
  patch: <T>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'body'>) =>
    request<T>('PATCH', path, { ...options, body }),
  /** Requisicoes de remocao. */
  delete: <T>(path: string, options?: ApiRequestOptions) => request<T>('DELETE', path, options),
  /** Atualiza ou remove token de autenticacao no armazenamento local. */
  setToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(STORAGE_TOKEN_KEY, token);
      return;
    }
    localStorage.removeItem(STORAGE_TOKEN_KEY);
  },
  /** Leitura direta do token persistido. */
  getToken: getStoredToken,
  /** Exposicao da URL base para diagnostico e logs. */
  baseUrl: API_BASE_URL
};