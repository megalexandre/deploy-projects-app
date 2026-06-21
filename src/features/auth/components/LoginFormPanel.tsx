import { ArrowRight, EnvelopeSimple, Eye, EyeSlash, Lock, Shield } from '@phosphor-icons/react';
import React from 'react';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import type { LoginCredentials } from '@/services';

interface LoginFormPanelProps {
  credentials: LoginCredentials;
  error: string;
  loading: boolean;
  showPassword: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onTogglePassword: () => void;
}

export const LoginFormPanel: React.FC<LoginFormPanelProps> = ({
  credentials,
  error,
  loading,
  showPassword,
  onChange,
  onSubmit,
  onTogglePassword,
}) => (
  <div className="md:col-span-5 flex justify-center md:justify-end">
    <div className="relative w-full max-w-[520px] overflow-hidden rounded-[22px] border border-white/10 bg-[rgba(22,31,48,0.72)] p-10 shadow-2xl backdrop-blur-[20px] sm:p-14">
      <div className="absolute -right-24 -top-24 h-56 w-56 rounded-full bg-[#a9c7ff] opacity-10 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1d71d4] text-[#f8f8ff]">
            <Shield className="h-7 w-7" weight="fill" />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#c1c6d5]">
            Acesso a plataforma
          </span>
          <h2 className="mt-2 text-[30px] font-semibold text-[#dce2f8]">Entrar na plataforma</h2>
          <p className="mt-2 text-sm text-[#c1c6d5]">Use suas credenciais de acesso cadastradas.</p>
        </div>

        <form className="space-y-7" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#dce2f8]" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <EnvelopeSimple className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c1c6d5]" />
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Login"
                value={credentials.email}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-[#414753] bg-[#151b2b] py-4 pl-12 pr-4 text-base text-[#dce2f8] placeholder:text-[#c1c6d5] focus:border-[#a9c7ff] focus:outline-none focus:ring-1 focus:ring-[#a9c7ff]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#dce2f8]" htmlFor="password">
              Senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#c1c6d5]" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                value={credentials.password}
                onChange={onChange}
                required
                className="w-full rounded-lg border border-[#414753] bg-[#151b2b] py-4 pl-12 pr-12 text-base text-[#dce2f8] placeholder:text-[#c1c6d5] focus:border-[#a9c7ff] focus:outline-none focus:ring-1 focus:ring-[#a9c7ff]"
              />
              <button
                type="button"
                onClick={onTogglePassword}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#c1c6d5] transition hover:text-[#dce2f8]"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && <ErrorAlert message={error} />}

          <div className="flex items-center">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#414753] bg-[#191f2f] text-[#a9c7ff] focus:ring-[#a9c7ff]"
              />
              <span className="text-xs text-[#c1c6d5]">Lembrar meu acesso</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[linear-gradient(90deg,#1d71d4_0%,#00c1ca_100%)] px-4 py-4 text-base font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{loading ? 'Entrando...' : 'Entrar no painel'}</span>
            {!loading && <ArrowRight className="h-5 w-5" />}
          </button>
        </form>
      </div>
    </div>
  </div>
);
