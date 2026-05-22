/** Pagina 'LoginPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useState } from 'react';
import { authService } from '../services/authService';
import type { LoginCredentials } from '@/services';
import { LoginFooter } from '../components/LoginFooter';
import { LoginFormPanel } from '../components/LoginFormPanel';
import { LoginHeroPanel } from '../components/LoginHeroPanel';

export const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(credentials);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0c1322] font-sans text-[#dce2f8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/fundo.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(12,19,34,0.86)_0%,rgba(12,19,34,0.56)_46%,rgba(12,19,34,0.8)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(7,14,29,0.78)_0%,rgba(7,14,29,0.18)_38%,rgba(7,14,29,0.54)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_20%_20%,rgba(29,113,212,0.12),transparent_28%),radial-gradient(circle_at_72%_36%,rgba(67,221,230,0.08),transparent_24%),radial-gradient(circle_at_58%_62%,rgba(93,96,235,0.08),transparent_20%)]" />
      </div>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-16">
        <div className="grid w-full max-w-[1440px] grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-12">
          <LoginHeroPanel />
          <LoginFormPanel
            credentials={credentials}
            error={error}
            loading={loading}
            showPassword={showPassword}
            onChange={handleChange}
            onSubmit={handleSubmit}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
          />
        </div>
      </main>

      <LoginFooter />
    </div>
  );
};
