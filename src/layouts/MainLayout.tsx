import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  SquaresFour,
  Folder,
  Gear,
  SignOut,
  List,
  X,
  Wrench,
  CurrencyDollar,
  Calendar,
  Users,
  Database,
  Sun,
  Moon
} from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { icon: SquaresFour, label: 'Dashboard', path: '/dashboard', color: 'text-opj-blue' },
    { icon: Folder, label: 'Projetos', path: '/projetos', color: 'text-opj-blue' },
    { icon: Wrench, label: 'Serviços', path: '/servicos', color: 'text-opj-blue' },
    { icon: CurrencyDollar, label: 'Financeiro', path: '/financeiro', color: 'text-opj-blue' },
    { icon: Calendar, label: 'Calendário', path: '/calendario', color: 'text-opj-blue' },
    { icon: Users, label: 'Usuários', path: '/usuarios', color: 'text-opj-blue' },
    { icon: Gear, label: 'Configurações', path: '/configuracoes', color: 'text-opj-blue' },
    { icon: Database, label: 'Banco de Dados', path: '/banco-de-dados', color: 'text-opj-blue' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <img 
              src="/imagem/opj-padrao 1.png" 
              alt="OPJ Engenharia" 
              className="h-8 w-auto"
            />
            <span className="text-xl font-alumni-bold text-gray-100">OPJ Engenharia</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
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
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700 space-y-2">
          <Button
            variant="outline"
            onClick={toggleTheme}
            className="w-full justify-start"
          >
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
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="w-full justify-start"
          >
            <SignOut className="mr-3 h-5 w-5" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-gray-800 border-b border-gray-700 lg:border-none border-t-4 border-t-opj-blue">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden"
            >
              <List className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400 font-alumni-regular">
                Sistema de Gestão Fotovoltaica
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children || <Outlet />}
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-900 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

