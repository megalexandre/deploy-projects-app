import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ClientesPage } from '@/features/clientes/pages/ClientesPage';
import { ProjetosPage } from '@/features/projetos/pages/ProjetosPage';
import { ProjetoDetailPage } from '@/features/projetos/pages/ProjetoDetailPage';
import { NovoProjetoPage } from '@/features/projetos/pages/NovoProjetoPage';
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
import { ConcessionariasPage } from '@/features/admin/pages/ConcessionariasPage';
import { ConfiguracoesPage } from '@/features/admin/pages/ConfiguracoesPage';
import { ProtectedLayout } from '@/shared/layouts/ProtectedLayout';
import { useAuthInterceptor } from '@/shared/hooks/useAuthInterceptor';
import { ENV } from '@/shared/config/env';

const getIsAuthenticated = () => Boolean(localStorage.getItem(ENV.AUTH_TOKEN_STORAGE_KEY));

const AppRoutes: React.FC = () => {
  useAuthInterceptor();

  return (
    <Routes>
      <Route path="/login" element={getIsAuthenticated() ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

      <Route element={<ProtectedLayout />}>
        {/* dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* clientes */}
        <Route path="/clientes" element={<ClientesPage />} />

        {/* projetos */}
        <Route path="/projetos" element={<ProjetosPage />} />
        <Route path="/projetos/novo" element={<NovoProjetoPage />} />
        <Route path="/projetos/:id" element={<ProjetoDetailPage />} />

        {/* servicos */}
        <Route path="/servicos" element={<ServicosPage />} />
        <Route path="/servicos/novo" element={<NovoServicoPage />} />
        <Route path="/servicos/:id" element={<ServicoDetailPage />} />

        {/* financeiro */}
        <Route path="/financeiro" element={<FinanceiroPage />} />
        <Route path="/financeiro/pagamentos" element={<PagamentosPage />} />
        <Route path="/financeiro/recebimentos" element={<RecebimentosPage />} />
        <Route path="/financeiro/faturas" element={<FaturasPage />} />

        {/* calendario */}
        <Route path="/calendario" element={<CalendarioPage />} />

        {/* aprovacoes */}
        <Route path="/aprovacoes" element={<AprovacoesPage />} />

        {/* admin */}
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/concessionarias" element={<ConcessionariasPage />} />
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
