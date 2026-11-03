import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FinanceiroPage } from './FinanceiroPage';
import { financeiroService, type TransacaoFinanceira } from '../services/financeiroService';

vi.mock('@/shared/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ id: 'admin', isAdmin: true }),
}));
vi.mock('@/features/projects/services/projectsService', () => ({
  projectsService: {
    getAll: vi.fn().mockResolvedValue([
      {
        id: 'project',
        sequence: 123,
        protocolo: 'P-123',
        valor: 100,
        cliente: { nome: 'Cliente' },
        dadosProjeto: {},
        dataCriacao: '2026-11-03',
      },
    ]),
  },
}));
vi.mock('@/features/servicos/services/servicosService', () => ({
  servicosService: {
    list: vi.fn().mockResolvedValue([
      {
        id: 'service',
        protocolo: 'S-1',
        cliente: 'Cliente',
        valorFinal: 100,
        dataCriacao: '2026-11-03',
      },
    ]),
  },
}));
vi.mock('@/features/admin/services/usersService', () => ({
  usersService: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../services/financeiroService', () => ({
  financeiroService: {
    listTransacoes: vi.fn(),
    createLedger: vi.fn(),
    updateLedger: vi.fn(),
    removeLedger: vi.fn(),
  },
}));
const transaction = {
  id: 'entry',
  descricao: 'Recebimento original',
  tipo: 'receita',
  valor: 100,
  data: '2026-11-03',
  categoria: 'Receitas',
  status: 'pago',
  projectId: 'project',
  ledger: { id: 'entry' },
} as TransacaoFinanceira;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(financeiroService.listTransacoes).mockResolvedValue([transaction]);
});
afterEach(cleanup);
const view = () =>
  render(
    <MemoryRouter>
      <FinanceiroPage />
    </MemoryRouter>,
  );

describe('CRUD do financeiro geral', () => {
  it('cria recebimento vinculado ao serviço escolhido e limpa o vínculo de projeto', async () => {
    view();
    await screen.findByRole('button', { name: 'Editar lançamento' });
    fireEvent.click(screen.getByRole('button', { name: 'Novo Lançamento' }));
    fireEvent.change(screen.getByLabelText('Projeto vinculado'), { target: { value: 'project' } });
    fireEvent.change(screen.getByLabelText('Serviço vinculado'), { target: { value: 'service' } });
    expect(screen.getByLabelText('Projeto vinculado')).toHaveValue('');
    fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: 'Quitação serviço' } });
    fireEvent.change(screen.getByLabelText(/^Valor/), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar lançamento' }));
    await waitFor(() =>
      expect(financeiroService.createLedger).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: null,
          service_id: 'service',
          amount: 100,
          reason: 'receita',
        }),
      ),
    );
  });
  it('preserva o vínculo ao editar o valor de um lançamento existente', async () => {
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar lançamento' }));
    expect(screen.getByLabelText('Projeto vinculado')).toHaveValue('project');
    fireEvent.change(screen.getByLabelText(/^Valor/), { target: { value: '4000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
    await waitFor(() =>
      expect(financeiroService.updateLedger).toHaveBeenCalledWith(
        'entry',
        expect.objectContaining({ project_id: 'project', service_id: null, amount: 40 }),
      ),
    );
  });
  it('exclui somente lançamentos reais e recalcula a lista após confirmar', async () => {
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir lançamento' }));
    expect(financeiroService.removeLedger).not.toHaveBeenCalled();
    vi.mocked(financeiroService.listTransacoes).mockResolvedValue([]);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(financeiroService.removeLedger).toHaveBeenCalledWith('entry'));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Excluir lançamento' })).not.toBeInTheDocument(),
    );
    expect(screen.queryByText('Recebimento original')).not.toBeInTheDocument();
    expect(screen.getAllByText('Previsto').length).toBeGreaterThan(0);
  });
});
