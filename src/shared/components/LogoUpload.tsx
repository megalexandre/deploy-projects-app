import { UploadSimple, X } from '@phosphor-icons/react';
import React, { useRef } from 'react';
import { Button } from './Button';

interface LogoUploadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ value, onChange, label = 'Logo' }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-200">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="flex items-center gap-4">
        {value ? (
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10">
            <img src={value} alt={label} className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-0.5 top-0.5 rounded-full bg-slate-900/80 p-0.5 text-slate-300 hover:text-rose-400"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 flex-shrink-0 rounded-lg border border-dashed border-white/20 bg-slate-800/40" />
        )}
        <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          <UploadSimple className="mr-2 h-4 w-4" />
          {value ? 'Trocar imagem' : 'Selecionar imagem'}
        </Button>
      </div>
    </div>
  );
};
