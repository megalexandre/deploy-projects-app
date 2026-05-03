import type { User } from '../types';

const STORAGE_USER_KEY = 'user';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getSessionUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return null;
    }

    return {
      id: typeof parsed.id === 'string' ? parsed.id : '',
      name: typeof parsed.name === 'string' ? parsed.name : '',
      email: typeof parsed.email === 'string' ? parsed.email : '',
      role: parsed.role === 'admin' || parsed.role === 'manager' || parsed.role === 'technician' ? parsed.role : 'technician'
    };
  } catch {
    return null;
  }
};

export const isAdminSessionUser = () => getSessionUser()?.role === 'admin';
