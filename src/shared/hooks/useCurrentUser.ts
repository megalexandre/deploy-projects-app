import { useState, useEffect } from 'react';
import type { User } from '@/types';
import { getSessionUser } from '@/shared/session/sessionUser';

export const useCurrentUser = (): User | null => {
  const [user, setUser] = useState<User | null>(() => getSessionUser());

  useEffect(() => {
    const handler = () => setUser(getSessionUser());
    window.addEventListener('auth-state-changed', handler);
    return () => window.removeEventListener('auth-state-changed', handler);
  }, []);

  return user;
};
