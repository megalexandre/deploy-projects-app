/** Ponto de entrada da aplicacao React: inicializa a arvore principal no DOM. */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary';

// StrictMode fica habilitado para expor efeitos colaterais e problemas de ciclo de vida durante desenvolvimento.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>,
);
