/// <reference types="vite/client" />

declare global {
  interface Window {
    __APP_ENV__?: Partial<{
      VITE_API_BASE_URL: string;
      VITE_AUTH_TOKEN_STORAGE_KEY: string;
      VITE_VIACEP_BASE_URL: string;
      VITE_API_PROXY_TARGET: string;
    }>;
  }
}

export {};
