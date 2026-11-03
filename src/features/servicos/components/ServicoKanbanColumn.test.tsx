import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Servico } from '@/types';
import { ServicoKanbanColumn } from './ServicoKanbanColumn';
import { servicosService } from '../services/servicosService';

vi.mock('../services/servicosService', () => ({
  servicosService: {
    statusFlow: [{ status: 'abertura_servico', etapa: 'Abertura do Serviço' }],
    updateIdentifier: vi.fn(),
  },
}));

const service: Servico = {
  id: 'service-1',
  protocolo: 'SERV-001',
  subsequencia: 'A',
  tipo: 'ligacao_nova',
  nome: 'Ligação Nova',
  cliente: 'Cliente',
  concessionaria: 'CEMIG',
  status: 'abertura_servico',
  dataAbertura: '2026-11-03',
  valor: 100,
  valorFinal: 100,
  cupomDescontoPct: 0,
  documentos: [],
  timeline: [],
  dataCriacao: '2026-11-03',
  dataAtualizacao: '2026-11-03',
};
const drag = vi.fn();

function Board({ admin = true }: { admin?: boolean }) {
  const [current, setCurrent] = useState(service);
  return (
    <MemoryRouter>
      <ServicoKanbanColumn
        column={{ status: 'abertura_servico', etapa: 'Abertura' }}
        servicos={[current]}
        draggedId={null}
        canManageStatus={admin}
        onDragStart={drag}
        onDragEnd={vi.fn()}
        onDrop={vi.fn()}
        onStatusChange={vi.fn()}
        onServiceUpdated={setCurrent}
      />
    </MemoryRouter>
  );
}

describe('identificador no card de serviço', () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(cleanup);

  it('abre pelo ID e atualiza o card imediatamente após salvar', async () => {
    vi.mocked(servicosService.updateIdentifier).mockResolvedValue({
      ...service,
      protocolo: '123',
      subsequencia: 'AB-1',
    });
    render(<Board />);
    fireEvent.click(screen.getByRole('button', { name: /Editar identificador do serviço/ }));
    expect(screen.getByRole('dialog', { name: 'Editar Identificador' })).toBeInTheDocument();
    expect(screen.getByLabelText('Identificador')).toHaveValue('SERV-001');
    fireEvent.change(screen.getByLabelText('Identificador'), { target: { value: ' 123 ' } });
    fireEvent.change(screen.getByLabelText('Subsequente'), { target: { value: ' ab-1 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(servicosService.updateIdentifier).toHaveBeenCalledWith('service-1', '123', 'AB-1');
    expect(
      screen.getByRole('button', { name: /Editar identificador do serviço 123\/AB-1/ }),
    ).toHaveTextContent('ID 123/AB-1');
    expect(drag).not.toHaveBeenCalled();
  });

  it('cancela sem salvar e oculta edição para integrador', () => {
    const { unmount } = render(<Board />);
    fireEvent.click(screen.getByRole('button', { name: /Editar identificador/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(servicosService.updateIdentifier).not.toHaveBeenCalled();
    unmount();
    render(<Board admin={false} />);
    expect(screen.queryByRole('button', { name: /Editar identificador/ })).not.toBeInTheDocument();
  });

  it('valida subsequente antes de enviar e permite removê-lo com zero', async () => {
    vi.mocked(servicosService.updateIdentifier).mockResolvedValue({
      ...service,
      subsequencia: undefined,
    });
    render(<Board />);
    fireEvent.click(screen.getByRole('button', { name: /Editar identificador/ }));
    fireEvent.change(screen.getByLabelText('Subsequente'), { target: { value: 'inválido /' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Subsequente deve ter até 20 caracteres');
    expect(servicosService.updateIdentifier).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText('Subsequente'), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    await waitFor(() =>
      expect(servicosService.updateIdentifier).toHaveBeenCalledWith('service-1', 'SERV-001', ''),
    );
  });

  it('mantém o modal aberto e o ID original se a API falhar', async () => {
    vi.mocked(servicosService.updateIdentifier).mockRejectedValue(new Error('Não autorizado'));
    render(<Board />);
    fireEvent.click(screen.getByRole('button', { name: /Editar identificador/ }));
    fireEvent.change(screen.getByLabelText('Identificador'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Não autorizado');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Editar identificador do serviço SERV-001\/A/ }),
    ).toBeInTheDocument();
  });
});
