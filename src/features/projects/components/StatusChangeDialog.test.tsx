import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatusChangeDialog } from './StatusChangeDialog';
import type { KanbanStatus } from '../kanban/kanbanConfig';

afterEach(cleanup);
const props = (status: KanbanStatus) => ({
  pendingStatusChange: { projectId: 'p1', nextStatus: status },
  statusComment: 'Motivo',
  statusStartDate: '',
  statusDurationDays: 0,
  updatingStatus: false,
  onCommentChange: vi.fn(),
  onStartDateChange: vi.fn(),
  onDurationDaysChange: vi.fn(),
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
});
describe('prazos ao mudar status', () => {
  it.each(['projeto_encerrado', 'projeto_cancelado'] as const)(
    'não pede prazo para %s',
    (status) => {
      render(<StatusChangeDialog {...props(status)} />);
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled();
    },
  );
  it('continua exigindo motivo para cancelar e prazo para uma etapa ativa', () => {
    const { unmount } = render(
      <StatusChangeDialog {...props('projeto_cancelado')} statusComment="" />,
    );
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
    unmount();
    render(<StatusChangeDialog {...props('projeto_aprovado')} />);
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled();
  });
});
