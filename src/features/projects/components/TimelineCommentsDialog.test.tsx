import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TimelineCommentsDialog } from './TimelineCommentsDialog';

const { user } = vi.hoisted(() => ({ user: { id: 'me', isAdmin: false } }));
vi.mock('@/shared/hooks/useCurrentUser', () => ({ useCurrentUser: () => user }));
const item = {
  id: 'status',
  etapa: 'Análise',
  data: '',
  status: 'em_andamento' as const,
  comentarios: [
    { id: 'own', texto: 'Meu comentário', data: '', createdBy: 'me' },
    { id: 'other', texto: 'Outro comentário', data: '', createdBy: 'other' },
  ],
};

describe('TimelineCommentsDialog', () => {
  beforeEach(() => {
    user.isAdmin = false;
  });
  afterEach(cleanup);
  const props = () => ({
    item,
    mode: 'view' as const,
    commentText: '',
    saving: false,
    onCommentTextChange: vi.fn(),
    onSave: vi.fn(),
    onClose: vi.fn(),
    onEdit: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn().mockResolvedValue(undefined),
  });
  it('integrador só edita o próprio comentário e envia o texto atualizado', async () => {
    const input = props();
    render(<TimelineCommentsDialog {...input} />);
    expect(screen.getAllByRole('button', { name: 'Editar' })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Editar comentário' }), {
      target: { value: ' Texto novo ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(input.onEdit).toHaveBeenCalledWith('own', 'Texto novo'));
  });
  it('administrador pode gerenciar comentários de outros usuários', () => {
    user.isAdmin = true;
    render(<TimelineCommentsDialog {...props()} />);
    expect(screen.getAllByRole('button', { name: 'Excluir comentário' })).toHaveLength(2);
  });
  it('exclusão depende de confirmação e mantém o identificador do comentário', async () => {
    const input = props();
    render(<TimelineCommentsDialog {...input} />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir comentário' }));
    expect(input.onRemove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(input.onRemove).toHaveBeenCalledWith('own'));
  });
});
