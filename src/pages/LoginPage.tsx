/** Pagina 'LoginPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useState } from 'react';
import { ArrowRight, EnvelopeSimple, Lightning, Lock, ShieldCheck, SunDim } from '@phosphor-icons/react';
import { authService } from '../services/authService';
import type { LoginCredentials } from '../services';

export const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(credentials);
      localStorage.setItem('user', JSON.stringify(response.user));
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
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-cyan-400/25 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-96 w-96 -translate-y-1/2 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 py-8 lg:grid-cols-2 lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-cyan-100">
              <SunDim className="h-4 w-4" />
              OPJ ENGENHARIA
            </p>
            <h1 className="mt-6 text-5xl font-extrabold leading-tight text-white">
              Gestao de projetos solares com visual premium.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-200/85">
              Ambiente moderno para acompanhar projetos, equipe, cronogramas e resultados com alta legibilidade e foco em produtividade.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-bold text-cyan-200">+320</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-300">Projetos</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-bold text-amber-300">98%</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-300">Entrega no prazo</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur">
                <p className="text-3xl font-bold text-sky-200">24h</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-slate-300">Atualizacao</p>
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm text-slate-200/90">
              <p className="flex items-center gap-2">
                <Lightning className="h-4 w-4 text-amber-300" />
                Fluxo otimizado para operacao tecnica e comercial.
              </p>
              <p className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-cyan-300" />
                Controle de acesso e dados centralizados.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
          <div className="rounded-3xl border border-white/20 bg-white/[0.07] p-8 shadow-[0_30px_80px_-35px_rgba(0,0,0,0.75)] backdrop-blur-2xl sm:p-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Acesso seguro</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Entrar na plataforma</h2>
              <p className="mt-2 text-sm text-slate-200/80">Use suas credenciais de acesso cadastradas na API.</p>
            </div>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Email</span>
                <div className="relative">
                  <EnvelopeSimple className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    name="email"
                    type="email"
                    placeholder="admin@opjengenharia.com.br"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/20 bg-slate-950/45 py-3 pl-11 pr-3 text-white placeholder:text-slate-300/70 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-200">Senha</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300" />
                  <input
                    name="password"
                    type="password"
                    placeholder="admin123"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-white/20 bg-slate-950/45 py-3 pl-11 pr-3 text-white placeholder:text-slate-300/70 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              Autenticacao via API ativa.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
