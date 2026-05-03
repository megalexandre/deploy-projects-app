import type { User } from '@/types';
import { isRecord } from '@/core/utils/normalize';

const STORAGE_USER_KEY = 'user';

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
