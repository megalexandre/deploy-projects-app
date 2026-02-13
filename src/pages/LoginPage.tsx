import React, { useState } from 'react';
import { EnvelopeSimple, Lock, House } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { authService } from '../services/authService';
import type { LoginCredentials } from '../types';

export const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted', credentials);
    setError('');
    setLoading(true);

    try {
      console.log('Calling authService.login...');
      const user = await authService.login(credentials);
      console.log('Login successful:', user);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('User saved to localStorage, navigating...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Input changed:', e.target.name, e.target.value);
    setCredentials(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <House className="h-12 w-12 text-opj-blue" />
          </div>
          <h2 className="text-3xl font-bold text-gray-100">
            OPJ Engenharia
          </h2>
          <p className="mt-2 text-gray-400">
            Sistema de Gestão de Projetos Fotovoltaicos
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 shadow-xl">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={credentials.email}
              onChange={handleChange}
              icon={<EnvelopeSimple />}
              required
            />

            <Input
              type="password"
              name="password"
              label="Senha"
              placeholder="••••••••"
              value={credentials.password}
              onChange={handleChange}
              required
              icon={<Lock />}
            />

            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>Demo: admin@opjengenharia.com.br / admin123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

