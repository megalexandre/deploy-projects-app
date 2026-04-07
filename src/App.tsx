/** Componente raiz da aplicacao: define rotas e composicao principal da interface. */
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProjetosPage } from './pages/ProjetosPage';
import { ProjetoDetailPage } from './pages/ProjetoDetailPage';
import { NovoProjetoPage } from './pages/NovoProjetoPage';
import { NovoServicoPage } from './pages/NovoServicoPage';
import { ServicosPage } from './pages/ServicosPage';
import { ServicoDetailPage } from './pages/ServicoDetailPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { PagamentosPage } from './pages/PagamentosPage';
import { RecebimentosPage } from './pages/RecebimentosPage';
import { FaturasPage } from './pages/FaturasPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { ConcessionariasPage } from './pages/ConcessionariasPage';
import { AprovacoesPage } from './pages/AprovacoesPage';
import { MainLayout } from './layouts/MainLayout';
import { useAuthInterceptor } from './hooks/useAuthInterceptor';
import { apiClient } from './services';

const getTokenKey = () => (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';
const getIsAuthenticated = () => Boolean(localStorage.getItem(getTokenKey()));

const ProtectedRoute: React.FC<{ children: React.ReactNode; isAuthenticated: boolean }> = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  // Mantem o comportamento global de sessao sincronizado com erros 401 do backend.
  useAuthInterceptor();

  const [isAuthenticated, setIsAuthenticated] = useState(getIsAuthenticated);

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(getIsAuthenticated());
    };

    window.addEventListener(apiClient.authStateChangedEvent, syncAuthState);
    window.addEventListener('storage', syncAuthState);

    return () => {
      window.removeEventListener(apiClient.authStateChangedEvent, syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  return (
    <Routes>
      {/* Todas as rotas autenticadas ficam encapsuladas pelo mesmo layout para manter navegacao e shell visual consistentes. */}
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><DashboardPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ClientesPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projetos"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ProjetosPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projetos/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ProjetoDetailPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicos"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ServicosPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicos/novo"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><NovoServicoPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicos/:id"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ServicoDetailPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><FinanceiroPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro/pagamentos"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><PagamentosPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro/recebimentos"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><RecebimentosPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/financeiro/faturas"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><FaturasPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/calendario"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><CalendarioPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><UsuariosPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/concessionarias"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ConcessionariasPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><ConfiguracoesPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/aprovacoes"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><AprovacoesPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projetos/novo"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <MainLayout><NovoProjetoPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
