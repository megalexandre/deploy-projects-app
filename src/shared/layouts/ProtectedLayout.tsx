import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiClient } from '@/services';
import { ENV } from '@/shared/config/env';
import { MainLayout } from './MainLayout';

const getIsAuthenticated = () => Boolean(localStorage.getItem(ENV.AUTH_TOKEN_STORAGE_KEY));

export const ProtectedLayout: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(getIsAuthenticated);

  useEffect(() => {
    const syncAuthState = () => setIsAuthenticated(getIsAuthenticated());
    window.addEventListener(apiClient.authStateChangedEvent, syncAuthState);
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener(apiClient.authStateChangedEvent, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
};
