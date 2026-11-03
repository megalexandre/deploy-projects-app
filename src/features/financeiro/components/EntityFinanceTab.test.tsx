import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityFinanceTab } from './EntityFinanceTab';
import { entityFinanceService, type EntityFinanceSnapshot } from '../services/entityFinanceService';

const { user } = vi.hoisted(() => ({ user: { id: 'admin', isAdmin: true } }));
vi.mock('@/shared/hooks/useCurrentUser', () => ({ useCurrentUser: () => user }));
vi.mock('../services/entityFinanceService', () => ({
  entityFinanceService: {
    getSnapshot: vi.fn(),
    saveReceipt: vi.fn(),
    saveExpense: vi.fn(),
    removeEntry: vi.fn(),
    setPaymentStatus: vi.fn(),
  },
}));

const snapshot = (paid: number): EntityFinanceSnapshot => ({
  payment: {
    descricao: 'Recebimento',
    valor: 100,
    valorRecebido: paid,
    valorPendente: 100 - paid,
    data: '2026-11-03',
    status: paid === 100 ? 'pago' : 'pendente',
  },
  receipts: [
    {
      id: 'receipt',
      descricao: 'Parcela',
      valor: paid,
      data: '2026-11-03',
      status: 'pago',
    },
  ],
  expenses: [
    {
      id: 'expense',
      descricao: 'Material',
      categoria: 'Despesas',
      valor: 10,
      data: '2026-11-03',
      status: 'pago',
    },
  ],
  summary: {
    receitaPrevista: 100,
    receitasRecebidas: paid,
    receitasPendentes: 100 - paid,
    despesas: 10,
    saldo: paid - 10,
    despesasPendentes: 0,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  user.id = 'admin';
  user.isAdmin = true;
  vi.mocked(entityFinanceService.getSnapshot).mockResolvedValue(snapshot(100));
});
afterEach(cleanup);

describe.each(['projeto', 'servico'] as const)('aba financeira de %s', (entityType) => {
  const view = () =>
    render(
      <EntityFinanceTab entityType={entityType} entityId="entity" entityLabel="123" amount={100} />,
    );
  it('edita recebimento existente sem duplicá-lo e mostra o saldo reaberto', async () => {
    vi.mocked(entityFinanceService.saveReceipt).mockResolvedValue(snapshot(40));
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'Editar recebimento' }));
    fireEvent.change(screen.getByLabelText(/Valor recebido/), { target: { value: '4000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar recebimento' }));
    await waitFor(() =>
      expect(entityFinanceService.saveReceipt).toHaveBeenCalledWith(
        expect.objectContaining({ entityType, entityId: 'entity' }),
        expect.objectContaining({ id: 'receipt', valor: 40 }),
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Editar recebimento' })).not.toBeInTheDocument(),
    );
    expect(screen.getByText('Pendente', { exact: true })).toBeInTheDocument();
  });
  it('exclui somente após confirmação e mantém a lista em caso de erro', async () => {
    vi.mocked(entityFinanceService.removeEntry).mockRejectedValue(
      new Error('Exclusão não permitida'),
    );
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir recebimento' }));
    expect(entityFinanceService.removeEntry).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Exclusão não permitida');
    expect(screen.getByText('Parcela', { exact: true })).toBeInTheDocument();
  });
  it('atualiza o status após excluir um recebimento', async () => {
    vi.mocked(entityFinanceService.removeEntry).mockResolvedValue({ ...snapshot(0), receipts: [] });
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir recebimento' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect(
      await screen.findByText('Nenhum recebimento registrado para este item.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Pendente', { exact: true })).toBeInTheDocument();
  });
  it('permite ao integrador enviar a ação sem depender de autoria na resposta da API', async () => {
    user.id = 'other';
    user.isAdmin = false;
    vi.mocked(entityFinanceService.removeEntry).mockRejectedValue(
      new Error('Você só pode editar ou excluir lançamentos criados por você.'),
    );
    view();
    await screen.findByText('Parcela', { exact: true });
    fireEvent.click(screen.getByRole('button', { name: 'Excluir recebimento' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você só pode editar ou excluir lançamentos criados por você.',
    );
    expect(screen.getByText('Parcela', { exact: true })).toBeInTheDocument();
  });

  it('conclui exclusão para integrador quando o backend autoriza, sem campos novos', async () => {
    user.id = 'integrator';
    user.isAdmin = false;
    vi.mocked(entityFinanceService.removeEntry).mockResolvedValue({ ...snapshot(0), receipts: [] });
    view();
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir recebimento' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect(
      await screen.findByText('Nenhum recebimento registrado para este item.'),
    ).toBeInTheDocument();
  });
});
