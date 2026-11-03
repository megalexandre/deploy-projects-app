import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppErrorBoundary } from './AppErrorBoundary';

const BrokenComponent = () => {
  throw new Error('falha de teste');
};

describe('AppErrorBoundary', () => {
  it('renderiza os filhos quando nao ha erro', () => {
    render(
      <AppErrorBoundary>
        <p>Aplicacao carregada</p>
      </AppErrorBoundary>,
    );

    expect(screen.getByText('Aplicacao carregada')).toBeInTheDocument();
  });

  it('exibe uma alternativa quando um descendente falha', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recarregar página' })).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
