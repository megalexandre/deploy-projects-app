import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
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
  Moon
} from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { useTheme } from '../hooks/useTheme';

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { icon: SquaresFour, label: 'Dashboard', path: '/dashboard' },
    { icon: Folder, label: 'Projetos', path: '/projetos' },
    { icon: Wrench, label: 'Servicos', path: '/servicos' },
    { icon: CurrencyDollar, label: 'Financeiro', path: '/financeiro' },
    { icon: Calendar, label: 'Calendario', path: '/calendario' },
    { icon: Users, label: 'Usuarios', path: '/usuarios' },
    { icon: Gear, label: 'Configuracoes', path: '/configuracoes' },
    { icon: Database, label: 'Banco de Dados', path: '/banco-de-dados' }
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-900 flex">
      <aside className="w-64 h-[100dvh] max-h-[100dvh] sticky top-0 bg-gray-800 border-r border-gray-700 flex flex-col overflow-hidden flex-shrink-0">
        <div className="flex items-center h-16 px-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <img src="/opj-padrao.png" alt="OPJ Engenharia" className="h-8 w-auto" />
            <span className="text-xl font-alumni-bold text-gray-100">OPJ Engenharia</span>
          </div>
        </div>

        <nav className="mt-6 px-3 flex-1 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${window.location.pathname === item.path
                      ? 'bg-opj-blue text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700 space-y-2 mt-auto">
          <Button variant="outline" onClick={toggleTheme} className="w-full justify-start">
            {theme === 'dark' ? (
              <>
                <Sun className="mr-3 h-5 w-5" />
                Tema Claro
              </>
            ) : (
              <>
                <Moon className="mr-3 h-5 w-5" />
                Tema Escuro
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={handleLogout} className="w-full justify-start">
            <SignOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="bg-gray-800 border-b border-gray-700 border-t-4 border-t-opj-blue">
          <div className="flex items-center justify-end h-16 px-4 sm:px-6 lg:px-8">
            <div className="text-sm text-gray-400 font-alumni-regular">Sistema de Gestao Fotovoltaica</div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};
