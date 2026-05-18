import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { type ConcessionaireData } from '../domain/concessionaire';
import { ConcessionaireFormCard } from './ConcessionaireFormCard';

const emptyForm = (): Omit<ConcessionaireData, 'id'> => ({
  name: '',
  acronym: '',
  code: '',
  region: '',
  phone: '',
  email: '',
  active: true,
  logo: null,
});

const defaultProps = {
  form: emptyForm(),
  setField: vi.fn(),
  editingId: null as string | null,
  saving: false,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
};

describe('ConcessionaireFormCard', () => {
  it('exibe título "Nova Concessionária" quando editingId é null', () => {
    render(<ConcessionaireFormCard {...defaultProps} />);
    expect(screen.getByText('Nova Concessionária')).toBeInTheDocument();
  });

  it('exibe título "Editar Concessionária" quando editingId está definido', () => {
    render(<ConcessionaireFormCard {...defaultProps} editingId="1" />);
    expect(screen.getByText('Editar Concessionária')).toBeInTheDocument();
  });

  it('não exibe botão cancelar quando editingId é null', () => {
    render(<ConcessionaireFormCard {...defaultProps} />);
    expect(screen.queryByText('Cancelar edição')).toBeNull();
  });

  it('exibe botão cancelar quando editingId está definido', () => {
    render(<ConcessionaireFormCard {...defaultProps} editingId="1" />);
    expect(screen.getByText('Cancelar edição')).toBeInTheDocument();
  });

  it('chama onCancel ao clicar em cancelar', () => {
    const onCancel = vi.fn();
    render(<ConcessionaireFormCard {...defaultProps} editingId="1" onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancelar edição'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('campo Nome tem atributo required', () => {
    render(<ConcessionaireFormCard {...defaultProps} />);
    const nameInput = screen.getByLabelText(/Nome/i);
    expect(nameInput).toBeRequired();
  });

  it('exibe "Cadastrar Concessionária" ao criar', () => {
    render(<ConcessionaireFormCard {...defaultProps} editingId={null} />);
    expect(screen.getByText('Cadastrar Concessionária')).toBeInTheDocument();
  });

  it('exibe "Salvar Alterações" ao editar', () => {
    render(<ConcessionaireFormCard {...defaultProps} editingId="1" />);
    expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
  });

  it('botão submit fica desabilitado quando saving é true', () => {
    render(<ConcessionaireFormCard {...defaultProps} saving={true} />);
    expect(screen.getByRole('button', { name: /Cadastrar/i })).toBeDisabled();
  });
});
