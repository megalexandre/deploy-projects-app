const getEnv = (key: string): string | undefined => {
  const runtimeEnv = window.__APP_ENV__;
  if (runtimeEnv && Object.prototype.hasOwnProperty.call(runtimeEnv, key)) {
    const val = runtimeEnv[key];
    return typeof val === 'string' ? val.trim() : undefined;
  }
  return (import.meta.env[key as keyof ImportMetaEnv] as string | undefined)?.trim();
};

export const ENV = {
  API_BASE_URL: getEnv('VITE_API_BASE_URL'),
  API_PROXY_TARGET: getEnv('VITE_API_PROXY_TARGET'),
  AUTH_TOKEN_STORAGE_KEY: getEnv('VITE_AUTH_TOKEN_STORAGE_KEY') ?? 'auth_token',
  VIACEP_BASE_URL: getEnv('VITE_VIACEP_BASE_URL'),
} as const;
