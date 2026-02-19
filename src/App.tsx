import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
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
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><DashboardPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projetos"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><ProjetosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projetos/:id"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><ProjetoDetailPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/servicos"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><ServicosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><FinanceiroPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro/pagamentos"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><PagamentosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro/recebimentos"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><RecebimentosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/financeiro/faturas"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><FaturasPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/calendario"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><CalendarioPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/usuarios"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><UsuariosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/configuracoes"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><ConfiguracoesPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/banco-de-dados"
          element={
            localStorage.getItem('user') ? (
              <MainLayout><BancoDeDadosPage /></MainLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/projetos/novo"
          element={
            localStorage.getItem('user') ? (
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
