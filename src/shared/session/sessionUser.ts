import type { User } from '@/types';
import { isRecord } from '@/core/utils/normalize';

const STORAGE_USER_KEY = 'user';
const AUTH_STATE_CHANGED_EVENT = 'auth-state-changed';

const normalizeRole = (value: unknown) =>
  typeof value === 'string'
    ? value.trim().toLowerCase() === 'admin'
      ? 'main'
      : value.trim().toLowerCase()
    : '';
const isAdminRole = (role: string) => role === 'main';

const notifyAuthStateChanged = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_STATE_CHANGED_EVENT));
  }
};

const mapStoredUser = (parsed: unknown): User | null => {
  if (!isRecord(parsed)) {
    return null;
  }

  const role = normalizeRole(parsed.role);

  return {
    id: typeof parsed.id === 'string' ? parsed.id : '',
    name: typeof parsed.name === 'string' ? parsed.name : '',
    email: typeof parsed.email === 'string' ? parsed.email : '',
    role,
    isAdmin: isAdminRole(role),
  };
};

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
    return mapStoredUser(parsed);
  } catch {
    return null;
  }
};

export const setSessionUser = (user: User) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalizedUser = {
    ...user,
    role: normalizeRole(user.role),
    isAdmin: isAdminRole(normalizeRole(user.role)),
  };

  window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(normalizedUser));
  notifyAuthStateChanged();
};

export const clearSessionUser = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_USER_KEY);
  notifyAuthStateChanged();
};

export const isAdminSessionUser = () => getSessionUser()?.isAdmin === true;
