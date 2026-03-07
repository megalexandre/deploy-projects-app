/** Layout 'MainLayout': define a estrutura base compartilhada entre paginas. */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  SquaresFour,
  Folder,
  Gear,
  SignOut,
  Wrench,
  CurrencyDollar,
  Calendar,
  Users,
  Database,
  Sun,
  Moon,
  List,
  X
} from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { useTheme } from '../hooks/useTheme';

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    const tokenKey = (import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY as string | undefined)?.trim() || 'auth_token';
    localStorage.removeItem('user');
    localStorage.removeItem(tokenKey);
    navigate('/login');
  };

  const menuItems = [
    { icon: SquaresFour, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Clientes', path: '/clientes' },
    { icon: Folder, label: 'Projetos', path: '/projetos' },
    { icon: Wrench, label: 'Servicos', path: '/servicos' },
    { icon: CurrencyDollar, label: 'Financeiro', path: '/financeiro' },
    { icon: Calendar, label: 'Calendario', path: '/calendario' },
    { icon: Users, label: 'Usuarios', path: '/usuarios' },
    { icon: Gear, label: 'Configuracoes', path: '/configuracoes' },
    { icon: Database, label: 'Banco de Dados', path: '/banco-de-dados' }
  ];

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/3 h-72 w-72 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex h-[100dvh]">
        <div
          className={`fixed inset-0 z-20 bg-slate-950/70 backdrop-blur-sm transition-opacity lg:hidden ${
            sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`fixed inset-y-0 left-0 z-30 flex h-[100dvh] w-72 flex-col border-r border-white/10 bg-slate-950/90 backdrop-blur-xl transition-transform duration-300 lg:static lg:inset-auto lg:z-auto lg:h-full lg:shrink-0 lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <div className="flex items-center gap-3">
              <img src="/opj-padrao.png" alt="OPJ Engenharia" className="h-8 w-auto" />
              <span className="text-base font-semibold tracking-wide text-slate-100">OPJ Engenharia</span>
            </div>
            <button
              type="button"
              className="rounded-lg border border-white/10 p-1 text-slate-300 hover:bg-slate-800 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-100 border border-cyan-300/30'
                      : 'text-slate-300 hover:border-white/10 hover:bg-slate-800/70 hover:text-white border border-transparent'
                  }`
                }
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="space-y-2 border-t border-white/10 p-4">
            <Button variant="outline" onClick={toggleTheme} className="w-full justify-start">
              {theme === 'dark' ? (
                <>
                  <Sun className="mr-2 h-5 w-5" />
                  Tema Claro
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-5 w-5" />
                  Tema Escuro
                </>
              )}
            </Button>
            <Button variant="secondary" onClick={handleLogout} className="w-full justify-start">
              <SignOut className="mr-2 h-5 w-5" />
              Sair
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden app-shell">
          <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800/70 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <List className="h-5 w-5" />
                Menu
              </button>
              <div className="hidden lg:block" />
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/90 sm:text-sm">
                Sistema de Gestao Fotovoltaica
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children || <Outlet />}
          </main>
        </div>
      </div>
    </div>
  );
};
