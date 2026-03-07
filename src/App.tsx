/** Componente raiz da aplicacao: define rotas e composicao principal da interface. */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientesPage } from './pages/ClientesPage';
import { ProjetosPage } from './pages/ProjetosPage';
import { ProjetoDetailPage } from './pages/ProjetoDetailPage';
import { NovoProjetoPage } from './pages/NovoProjetoPage';
import { ServicosPage } from './pages/ServicosPage';
import { FinanceiroPage } from './pages/FinanceiroPage';
import { PagamentosPage } from './pages/PagamentosPage';
import { RecebimentosPage } from './pages/RecebimentosPage';
import { FaturasPage } from './pages/FaturasPage';
import { CalendarioPage } from './pages/CalendarioPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ConfiguracoesPage } from './pages/ConfiguracoesPage';
import { BancoDeDadosPage } from './pages/BancoDeDadosPage';
import { MainLayout } from './layouts/MainLayout';

function App() {
  const tokenKey = (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';
  const isAuthenticated = Boolean(localStorage.getItem('user') && localStorage.getItem(tokenKey));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <MainLayout><DashboardPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/clientes"
          element={
            isAuthenticated ? (
              <MainLayout><ClientesPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projetos"
          element={
            isAuthenticated ? (
              <MainLayout><ProjetosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projetos/:id"
          element={
            isAuthenticated ? (
              <MainLayout><ProjetoDetailPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/servicos"
          element={
            isAuthenticated ? (
              <MainLayout><ServicosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro"
          element={
            isAuthenticated ? (
              <MainLayout><FinanceiroPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro/pagamentos"
          element={
            isAuthenticated ? (
              <MainLayout><PagamentosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro/recebimentos"
          element={
            isAuthenticated ? (
              <MainLayout><RecebimentosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro/faturas"
          element={
            isAuthenticated ? (
              <MainLayout><FaturasPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendario"
          element={
            isAuthenticated ? (
              <MainLayout><CalendarioPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/usuarios"
          element={
            isAuthenticated ? (
              <MainLayout><UsuariosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/configuracoes"
          element={
            isAuthenticated ? (
              <MainLayout><ConfiguracoesPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/banco-de-dados"
          element={
            isAuthenticated ? (
              <MainLayout><BancoDeDadosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projetos/novo"
          element={
            isAuthenticated ? (
              <MainLayout><NovoProjetoPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
