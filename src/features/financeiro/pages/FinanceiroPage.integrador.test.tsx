import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDailyChartLabels } from '../domain/integratorFinance';
import { FinanceiroPage } from './FinanceiroPage';

vi.mock('@/shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ id: 'integrador-1', nome: 'Integrador', isAdmin: false }),
}));

vi.mock('@/features/projects/services/projectsService', () => ({
  projectsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'project-1',
        sequence: 123,
        protocolo: 'P-123',
        valor: 100,
        status: 'projeto_aprovado',
        cliente: { nome: 'Cliente Teste' },
        dadosProjeto: { integradorId: 'integrador-1', integrador: 'Integrador' },
        dataCriacao: '2026-11-03',
      },
    ]),
  },
}));

vi.mock('../services/financeiroService', () => ({
  financeiroService: {
    listTransacoes: vi.fn().mockResolvedValue([]),
  },
}));

afterEach(cleanup);

describe('Financeiro do integrador', () => {
  it('não corta datas antigas do gráfico de todo o período', () => {
    const rows = Array.from({ length: 20 }, (_, index) => {
      const date = `2026-10-${String(index + 1).padStart(2, '0')}`;
      return { dataReceita: date, dataPrevista: date };
    });

    expect(getDailyChartLabels(rows)).toHaveLength(20);
  });

  it('mostra o status do Kanban depois do cliente no lugar da coluna de projeto', async () => {
    render(
      <MemoryRouter>
        <FinanceiroPage />
      </MemoryRouter>,
    );

    const table = await screen.findByRole('table');
    expect(screen.getByText('Valores pagos')).toBeInTheDocument();
    expect(screen.queryByText('Valores recebidos')).not.toBeInTheDocument();
    expect(screen.getByText('Valores por data')).toBeInTheDocument();
    expect(screen.getByText(/Compare rapidamente o que já foi pago/)).toBeInTheDocument();
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent?.trim());

    expect(headers.slice(0, 2)).toEqual(['Cliente', 'Status do projeto']);
    expect(headers).not.toContain('Projeto');
    expect(within(table).getByText('Projeto Aprovado')).toBeInTheDocument();
    expect(within(table).queryByText('123')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Personalizado' }));
    const initialDateInput = screen.getByLabelText('Data inicial');
    const maximumDate = initialDateInput.getAttribute('max');
    expect(initialDateInput).toHaveAttribute('min', '2026-11-03');
    expect(initialDateInput).toHaveAttribute('max');
    expect(screen.getByLabelText('Data final')).toHaveAttribute('min', '2026-11-03');
    expect(screen.getByText(/Período disponível:/)).toBeInTheDocument();

    fireEvent.change(initialDateInput, { target: { value: '9999-12-31' } });
    expect(initialDateInput).toHaveValue(maximumDate);
  });
});
