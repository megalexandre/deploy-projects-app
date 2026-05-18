import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { columns } from '../../kanban/kanbanConfig';
import { StatusSelect } from './StatusSelect';

const defaultProps = {
  projectId: 'proj-1',
  status: 'em_analise_documentacao' as const,
  canManageStatus: true,
  onStatusChange: vi.fn(),
};

describe('StatusSelect', () => {
  describe('renderização', () => {
    it('exibe todas as colunas do kanban como opções', () => {
      render(<StatusSelect {...defaultProps} />);

      columns.forEach((column) => {
        expect(screen.getByText(column.label)).toBeInTheDocument();
      });
    });

    it('marca o status atual como selecionado', () => {
      render(<StatusSelect {...defaultProps} status="projeto_aprovado" />);

      expect(screen.getByRole('combobox')).toHaveValue('projeto_aprovado');
    });
  });

  describe('quando canManageStatus é false', () => {
    it('renderiza o select como disabled', () => {
      render(<StatusSelect {...defaultProps} canManageStatus={false} />);

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('quando canManageStatus é true', () => {
    it('chama onStatusChange com projectId e novo status ao mudar', () => {
      const onStatusChange = vi.fn();
      render(<StatusSelect {...defaultProps} onStatusChange={onStatusChange} />);

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'projeto_aprovado' } });

      expect(onStatusChange).toHaveBeenCalledWith('proj-1', 'projeto_aprovado');
    });
  });
});
