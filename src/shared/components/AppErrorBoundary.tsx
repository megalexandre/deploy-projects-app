import React from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Erro inesperado ao renderizar a aplicação:', error, errorInfo);
  }

  private reloadApplication = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <section
          className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900/80 p-8 text-center shadow-2xl"
          role="alert"
        >
          <img src="/opj-padrao.png" alt="OPJ Engenharia" className="mx-auto mb-6 h-12 w-auto" />
          <h1 className="text-2xl font-semibold">Não foi possível carregar a aplicação</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Ocorreu um erro inesperado. Recarregue a página para tentar novamente.
          </p>
          <button
            type="button"
            onClick={this.reloadApplication}
            className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
          >
            Recarregar página
          </button>
        </section>
      </main>
    );
  }
}
