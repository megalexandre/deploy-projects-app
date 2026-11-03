import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocumentRemoveButton } from './DocumentRemoveButton';
import { filesService } from '@/shared/api/filesService';

const { user } = vi.hoisted(() => ({ user: { id: 'me', isAdmin: false } }));
vi.mock('@/shared/hooks/useCurrentUser', () => ({ useCurrentUser: () => user }));
vi.mock('@/shared/api/filesService', () => ({
  filesService: { listByItem: vi.fn(), remove: vi.fn() },
}));
const document = {
  id: 'file',
  fileId: 'file',
  nome: 'CPF.pdf',
  tipo: 'Documento',
  dataUpload: '',
  tamanho: 10,
};

describe('DocumentRemoveButton', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    user.isAdmin = false;
  });
  afterEach(cleanup);
  it('oculta exclusão de arquivo enviado por outro usuário', async () => {
    vi.mocked(filesService.listByItem).mockResolvedValue([
      { id: 'file', fileName: 'CPF.pdf', size: 10, urlS3: '', createdBy: 'other' },
    ]);
    render(<DocumentRemoveButton itemId="service" document={document} onRemoved={vi.fn()} />);
    await waitFor(() => expect(filesService.listByItem).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Excluir documento' })).not.toBeInTheDocument();
  });
  it('exige confirmação do proprietário e mostra erro sem retirar a ação', async () => {
    vi.mocked(filesService.listByItem).mockResolvedValue([
      { id: 'file', fileName: 'CPF.pdf', size: 10, urlS3: '', createdBy: 'me' },
    ]);
    vi.mocked(filesService.remove).mockRejectedValue(new Error('Sem permissão'));
    const refresh = vi.fn();
    render(<DocumentRemoveButton itemId="service" document={document} onRemoved={refresh} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Excluir documento' }));
    expect(filesService.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sem permissão');
    expect(refresh).not.toHaveBeenCalled();
  });
  it('administrador pode excluir arquivo de outro usuário', async () => {
    user.isAdmin = true;
    vi.mocked(filesService.listByItem).mockResolvedValue([
      { id: 'file', fileName: 'CPF.pdf', size: 10, urlS3: '', createdBy: 'other' },
    ]);
    render(<DocumentRemoveButton itemId="service" document={document} onRemoved={vi.fn()} />);
    expect(await screen.findByRole('button', { name: 'Excluir documento' })).toBeInTheDocument();
  });
});
