/** Componente raiz da aplicacao: define rotas e composicao principal da interface. */
import React from 'react';
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
import { BancoDeDadosPage } from './pages/BancoDeDadosPage';
import { ConcessionariasPage } from './pages/ConcessionariasPage';
import { MainLayout } from './layouts/MainLayout';
import { useAuthInterceptor } from './hooks/useAuthInterceptor';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const tokenKey = (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';
  const isAuthenticated = Boolean(localStorage.getItem(tokenKey));

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  useAuthInterceptor();

  const tokenKey = (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';
  const isAuthenticated = Boolean(localStorage.getItem(tokenKey));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout><DashboardPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <MainLayout><ClientesPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projetos"
          element={
            <ProtectedRoute>
              <MainLayout><ProjetosPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projetos/:id"
          element={
            <ProtectedRoute>
              <MainLayout><ProjetoDetailPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicos"
          element={
            <ProtectedRoute>
              <MainLayout><ServicosPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicos/novo"
          element={
            <ProtectedRoute>
              <MainLayout><NovoServicoPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicos/:id"
          element={
            <ProtectedRoute>
              <MainLayout><ServicoDetailPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute>
              <MainLayout><FinanceiroPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/pagamentos"
          element={
            <ProtectedRoute>
              <MainLayout><PagamentosPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/recebimentos"
          element={
            <ProtectedRoute>
              <MainLayout><RecebimentosPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro/faturas"
          element={
            <ProtectedRoute>
              <MainLayout><FaturasPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendario"
          element={
            <ProtectedRoute>
              <MainLayout><CalendarioPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <MainLayout><UsuariosPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/concessionarias"
          element={
            <ProtectedRoute>
              <MainLayout><ConcessionariasPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/configuracoes"
          element={
            <ProtectedRoute>
              <MainLayout><ConfiguracoesPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/banco-de-dados"
          element={
            <ProtectedRoute>
              <MainLayout><BancoDeDadosPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projetos/novo"
          element={
            <ProtectedRoute>
              <MainLayout><NovoProjetoPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
