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

const getEnv = (key: keyof ImportMetaEnv) => {
  const runtimeEnv = window.__APP_ENV__;
  const runtimeKey = key as 'VITE_API_BASE_URL' | 'VITE_AUTH_TOKEN_STORAGE_KEY' | 'VITE_VIACEP_BASE_URL' | 'VITE_API_PROXY_TARGET';

  if (runtimeEnv && Object.prototype.hasOwnProperty.call(runtimeEnv, runtimeKey)) {
    const runtimeValue = runtimeEnv[runtimeKey];
    return typeof runtimeValue === 'string' ? runtimeValue.trim() : undefined;
  }

  const value = (import.meta.env[key] as string | undefined)?.trim();

  return value;
};

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);
const removeTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

/** Base opcional da API e alvo de proxy definidos por ambiente/runtime. */
const API_BASE_URL = getEnv('VITE_API_BASE_URL');
const API_PROXY_TARGET = getEnv('VITE_API_PROXY_TARGET');

const resolveApiBaseUrl = () => {
  if (API_BASE_URL) {
    if (import.meta.env.DEV && API_BASE_URL === '/api') {
      return '/api';
    }

    if (isAbsoluteUrl(API_BASE_URL)) {
      return removeTrailingSlash(API_BASE_URL);
    }

    if (API_PROXY_TARGET) {
      return `${removeTrailingSlash(API_PROXY_TARGET)}${ensureLeadingSlash(API_BASE_URL)}`;
    }

    return removeTrailingSlash(API_BASE_URL);
  }

  if (API_PROXY_TARGET) {
    return removeTrailingSlash(API_PROXY_TARGET);
  }

  throw new Error('Variavel de ambiente obrigatoria ausente: defina VITE_API_PROXY_TARGET ou VITE_API_BASE_URL');
};

const RESOLVED_API_BASE_URL = resolveApiBaseUrl();

/** Chave do localStorage onde o token de autenticacao e salvo. */
const STORAGE_TOKEN_KEY = getEnv('VITE_AUTH_TOKEN_STORAGE_KEY') || 'auth_token';
const STORAGE_USER_KEY = 'user';
const AUTH_STATE_CHANGED_EVENT = 'auth-state-changed';
let unauthorizedHandler: ((error: ApiError) => void | Promise<void>) | null = null;
let handlingUnauthorized = false;

const notifyAuthStateChanged = () => {
  window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
};

/** Monta URL final, incluindo endpoint e query params validos. */
const buildUrl = (path: string, query?: ApiRequestOptions['query']) => {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const searchParams = new URLSearchParams();

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value));
      }
    });
  }

  const search = searchParams.toString();

  if (!isAbsoluteUrl(RESOLVED_API_BASE_URL)) {
    const relativeBase = removeTrailingSlash(RESOLVED_API_BASE_URL || '/api');
    const url = `${relativeBase}${endpoint}`;
    return search ? `${url}?${search}` : url;
  }

  const url = new URL(`${RESOLVED_API_BASE_URL}${endpoint}`);

  searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
};

/** Recupera token persistido da sessao atual. */
const getStoredToken = () => localStorage.getItem(STORAGE_TOKEN_KEY);
const clearStoredSession = () => {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_USER_KEY);
  notifyAuthStateChanged();
};

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
    // Todos os services recebem o mesmo formato de erro, evitando tratamento ad hoc em cada tela.
    const error = new ApiError(
      resolveErrorMessage(payload, 'Erro na comunicacao com o servidor'),
      response.status,
      payload
    );

    if (error.status === 401 && unauthorizedHandler && !handlingUnauthorized) {
      handlingUnauthorized = true;
      clearStoredSession();

      try {
        await unauthorizedHandler(error);
      } finally {
        window.setTimeout(() => {
          handlingUnauthorized = false;
        }, 0);
      }
    }

    throw error;
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
      notifyAuthStateChanged();
      return;
    }
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    notifyAuthStateChanged();
  },
  /** Leitura direta do token persistido. */
  getToken: getStoredToken,
  /** Limpa token e usuario persistidos. */
  clearSession: clearStoredSession,
  /** Registra um handler global para respostas 401. */
  setUnauthorizedHandler: (handler: ((error: ApiError) => void | Promise<void>) | null) => {
    unauthorizedHandler = handler;
  },
  /** Exposicao da URL base para diagnostico e logs. */
  baseUrl: RESOLVED_API_BASE_URL,
  authStateChangedEvent: AUTH_STATE_CHANGED_EVENT
};
