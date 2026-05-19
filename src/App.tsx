import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ClientesPage } from '@/features/clientes/pages/ClientesPage';
import { ProjetosPage } from '@/features/projects/pages/ProjetosPage';
import { ProjetoDetailPage } from '@/features/projects/pages/ProjetoDetailPage';
import { NovoProjetoPage } from '@/features/projects/pages/NovoProjetoPage';
import { ServicosPage } from '@/features/servicos/pages/ServicosPage';
import { ServicoDetailPage } from '@/features/servicos/pages/ServicoDetailPage';
import { NovoServicoPage } from '@/features/servicos/pages/NovoServicoPage';
import { FinanceiroPage } from '@/features/financeiro/pages/FinanceiroPage';
import { PagamentosPage } from '@/features/financeiro/pages/PagamentosPage';
import { RecebimentosPage } from '@/features/financeiro/pages/RecebimentosPage';
import { FaturasPage } from '@/features/financeiro/pages/FaturasPage';
import { CalendarioPage } from '@/features/calendario/pages/CalendarioPage';
import { AprovacoesPage } from '@/features/aprovacoes/pages/AprovacoesPage';
import { UsuariosPage } from '@/features/admin/pages/UsuariosPage';
import { ConcessionairesPage } from '@/features/concessionaries/pages/ConcessionairesPage';
import { ConfiguracoesPage } from '@/features/admin/pages/ConfiguracoesPage';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthInterceptor } from '@/shared/hooks/useAuthInterceptor';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { ENV } from '@/shared/config/env';

const getIsAuthenticated = () => Boolean(localStorage.getItem(ENV.AUTH_TOKEN_STORAGE_KEY));

const AdminOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = useCurrentUser();

  if (!currentUser?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  useAuthInterceptor();

  return (
    <Routes>
      <Route
        path="/login"
        element={getIsAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/projetos" element={<ProjetosPage />} />
        <Route path="/projetos/novo" element={<NovoProjetoPage />} />
        <Route path="/projetos/:id" element={<ProjetoDetailPage />} />
        <Route path="/servicos" element={<ServicosPage />} />
        <Route path="/servicos/novo" element={<NovoServicoPage />} />
        <Route path="/servicos/:id" element={<ServicoDetailPage />} />
        <Route path="/financeiro" element={<FinanceiroPage />} />
        <Route path="/financeiro/pagamentos" element={<PagamentosPage />} />
        <Route path="/financeiro/recebimentos" element={<RecebimentosPage />} />
        <Route path="/financeiro/faturas" element={<FaturasPage />} />
        <Route path="/calendario" element={<CalendarioPage />} />
        <Route
          path="/aprovacoes"
          element={
            <AdminOnlyRoute>
              <AprovacoesPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminOnlyRoute>
              <UsuariosPage />
            </AdminOnlyRoute>
          }
        />
        <Route
          path="/concessionarias"
          element={
            <AdminOnlyRoute>
              <ConcessionairesPage />
            </AdminOnlyRoute>
          }
        />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      </Route>

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
