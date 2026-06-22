import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ConcessionaireSelect } from './ConcessionaireSelect';
import type { Concessionaire } from '@/services';

const makeConcessionaria = (overrides: Partial<Concessionaire> = {}): Concessionaire => ({
  id: '1',
  name: 'Enel',
  acronym: 'EN',
  code: 'ENL',
  region: 'SP',
  phone: '',
  email: '',
  active: true,
  logo: null,
  ...overrides,
});

const defaultProps = {
  value: '',
  onChange: vi.fn(),
  concessionarias: [],
};

const renderSelect = (props = {}) =>
  render(
    <MemoryRouter>
      <ConcessionaireSelect {...defaultProps} {...props} />
    </MemoryRouter>,
  );

describe('ConcessionaireSelect', () => {
  it('exibe "Selecione..." como opção padrão', () => {
    renderSelect();
    expect(screen.getByRole('option', { name: 'Selecione...' })).toBeInTheDocument();
  });

  it('exibe "Carregando..." na opção padrão quando loading é true', () => {
    renderSelect({ loading: true });
    expect(screen.getByRole('option', { name: 'Carregando...' })).toBeInTheDocument();
  });

  it('desabilita o select quando loading é true', () => {
    renderSelect({ loading: true });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('habilita o select quando loading é false', () => {
    renderSelect({ loading: false });
    expect(screen.getByRole('combobox')).not.toBeDisabled();
  });

  it('renderiza uma opção por concessionária', () => {
    const concessionarias = [
      makeConcessionaria({ id: '1', name: 'Enel' }),
      makeConcessionaria({ id: '2', name: 'Cpfl' }),
    ];
    renderSelect({ concessionarias });
    expect(screen.getByRole('option', { name: 'Enel' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Cpfl' })).toBeInTheDocument();
  });

  it('chama onChange com o nome da concessionária ao selecionar', () => {
    const onChange = vi.fn();
    const concessionarias = [makeConcessionaria({ id: '1', name: 'Enel' })];
    renderSelect({ onChange, concessionarias });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Enel' } });
    expect(onChange).toHaveBeenCalledWith('Enel');
  });

  it('exibe contagem quando há concessionárias', () => {
    const concessionarias = [
      makeConcessionaria({ id: '1' }),
      makeConcessionaria({ id: '2', name: 'Cpfl' }),
    ];
    renderSelect({ concessionarias });
    expect(screen.getByText(/2 concessionária/i)).toBeInTheDocument();
  });

  it('exibe mensagem de vazio quando não há concessionárias', () => {
    renderSelect({ concessionarias: [] });
    expect(screen.getByText(/nenhuma concessionária ativa/i)).toBeInTheDocument();
  });

  it('não exibe link de admin por padrão', () => {
    renderSelect();
    expect(screen.queryByRole('link', { name: /gerenciar/i })).toBeNull();
  });

  it('exibe link para /concessionarias quando isAdmin é true', () => {
    renderSelect({ isAdmin: true });
    const link = screen.getByRole('link', { name: /gerenciar/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/concessionarias');
  });
});
