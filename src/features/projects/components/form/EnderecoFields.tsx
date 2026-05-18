import React from 'react';
import { maskCep } from '@/core/utils/masks';
import type { EnderecoForm } from '@/features/projects/domain/types';
import { FormField } from './FormField';
import { inputCls, readonlyCls } from './fieldCls';

interface EnderecoFieldsProps {
  endereco: EnderecoForm;
  onChange: (field: keyof EnderecoForm, value: string) => void;
  onCepBlur?: () => void;
  readOnly?: boolean;
}

export const EnderecoFields: React.FC<EnderecoFieldsProps> = ({
  endereco,
  onChange,
  onCepBlur,
  readOnly = false,
}) => {
  const cls = readOnly ? readonlyCls : inputCls;

  return (
    <>
      <div>
        <FormField label="CEP">
          <input
            value={endereco.cep}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onChange('cep', maskCep(e.target.value))}
            onBlur={readOnly ? undefined : onCepBlur}
            inputMode="numeric"
            placeholder={readOnly ? undefined : '00000-000'}
            className={cls}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Numero">
          <input
            value={endereco.numero}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onChange('numero', e.target.value)}
            className={cls}
          />
        </FormField>
      </div>

      <div className="md:col-span-2">
        <FormField label="Logradouro">
          <input
            value={endereco.logradouro}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onChange('logradouro', e.target.value)}
            className={cls}
          />
        </FormField>
      </div>

      <div className="md:col-span-2">
        <FormField label="Complemento">
          <input
            value={endereco.complemento}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onChange('complemento', e.target.value)}
            className={cls}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Bairro">
          <input
            value={endereco.bairro}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onChange('bairro', e.target.value)}
            className={cls}
          />
        </FormField>
      </div>

      <div>
        <FormField label="Cidade">
          <input
            value={endereco.cidade}
            readOnly={readOnly}
            onChange={readOnly ? undefined : (e) => onChange('cidade', e.target.value)}
            className={cls}
          />
        </FormField>
      </div>

      <div>
        <FormField label="UF">
          <input
            maxLength={2}
            value={endereco.estado}
            readOnly={readOnly}
            onChange={
              readOnly ? undefined : (e) => onChange('estado', e.target.value.toUpperCase())
            }
            className={`${cls} text-center`}
          />
        </FormField>
      </div>
    </>
  );
};
