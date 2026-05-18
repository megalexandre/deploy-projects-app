import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogoUpload } from './LogoUpload';

const BASE64 = 'data:image/png;base64,abc123';

beforeEach(() => {
  vi.stubGlobal(
    'FileReader',
    vi.fn().mockImplementation(() => {
      const instance = {
        result: BASE64,
        onload: null as (() => void) | null,
        readAsDataURL: vi.fn().mockImplementation(() => {
          instance.onload?.();
        }),
      };
      return instance;
    }),
  );
});

describe('LogoUpload', () => {
  it('renderiza placeholder quando value é null', () => {
    render(<LogoUpload value={null} onChange={vi.fn()} />);
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('renderiza preview da imagem quando value é fornecido', () => {
    render(<LogoUpload value={BASE64} onChange={vi.fn()} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', BASE64);
  });

  it('exibe "Selecionar imagem" quando sem valor', () => {
    render(<LogoUpload value={null} onChange={vi.fn()} />);
    expect(screen.getByText('Selecionar imagem')).toBeInTheDocument();
  });

  it('exibe "Trocar imagem" quando há valor', () => {
    render(<LogoUpload value={BASE64} onChange={vi.fn()} />);
    expect(screen.getByText('Trocar imagem')).toBeInTheDocument();
  });

  it('chama onChange com base64 ao selecionar arquivo', () => {
    const onChange = vi.fn();
    render(<LogoUpload value={null} onChange={onChange} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    fireEvent.change(input, { target: { files: [file] } });

    expect(onChange).toHaveBeenCalledWith(BASE64);
  });

  it('chama onChange(null) ao clicar no botão X', () => {
    const onChange = vi.fn();
    render(<LogoUpload value={BASE64} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: '' }));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('usa o label customizado quando fornecido', () => {
    render(<LogoUpload value={null} onChange={vi.fn()} label="Logotipo" />);
    expect(screen.getByText('Logotipo')).toBeInTheDocument();
  });
});
