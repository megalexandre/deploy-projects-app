/// <reference types="vite/client" />

declare global {
  interface Window {
    __APP_ENV__?: Record<string, string | undefined>;
  }
}

export {};
