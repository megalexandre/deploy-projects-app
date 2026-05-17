import { maskCnpj, maskCpf, maskPhoneBR } from '@/core/utils/masks';
import type { ClienteForm, EnderecoForm, TipoDocumento } from '@/features/projects/domain/types';
import React from 'react';
import { EnderecoFields } from '../EnderecoFields';
import { FormField } from '../FormField';
import { inputCls, selectCls } from '../fieldCls';

interface NovoClienteFormProps {
  tipoDocumento: TipoDocumento;
  setTipoDocumento: (v: TipoDocumento) => void;
  clienteForm: ClienteForm;
  setClienteForm: React.Dispatch<React.SetStateAction<ClienteForm>>;
  fillAddressFromCep: (
    cep: string,
    callback: (endereco: Omit<EnderecoForm, 'numero'>) => void,
  ) => Promise<void>;
}

export const NovoClienteForm: React.FC<NovoClienteFormProps> = ({
  tipoDocumento,
  setTipoDocumento,
  clienteForm,
  setClienteForm,
  fillAddressFromCep,
}) => {
  const setClienteField = <K extends keyof Omit<ClienteForm, 'endereco'>>(
    field: K,
    value: ClienteForm[K],
  ) => setClienteForm((prev) => ({ ...prev, [field]: value }));

  const setEnderecoField = (field: keyof EnderecoForm, value: string) =>
    setClienteForm((prev) => ({ ...prev, endereco: { ...prev.endereco, [field]: value } }));

  const handleCepBlur = () =>
    void fillAddressFromCep(clienteForm.endereco.cep, (endereco) =>
      setClienteForm((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: endereco.cep,
          logradouro: endereco.logradouro || prev.endereco.logradouro,
          complemento: prev.endereco.complemento || endereco.complemento,
          bairro: endereco.bairro || prev.endereco.bairro,
          cidade: endereco.cidade || prev.endereco.cidade,
          estado: endereco.estado || prev.endereco.estado,
        },
      })),
    );

  return (
    <div className="rounded-lg border border-gray-700 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Dados do novo cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Nome Completo" colSpan="full">
          <input
            value={clienteForm.nome}
            onChange={(e) => setClienteField('nome', e.target.value)}
            className={inputCls}
          />
        </FormField>

        <FormField label="Documento">
          <div className="grid grid-cols-3 gap-2">
            <select
              value={tipoDocumento}
              onChange={(e) => {
                setTipoDocumento(e.target.value as TipoDocumento);
                setClienteField('cpfCnpj', '');
              }}
              className={`col-span-1 ${selectCls}`}
            >
              <option value="cpf">CPF</option>
              <option value="cnpj">CNPJ</option>
            </select>
            <input
              value={clienteForm.cpfCnpj}
              onChange={(e) =>
                setClienteField(
                  'cpfCnpj',
                  tipoDocumento === 'cpf' ? maskCpf(e.target.value) : maskCnpj(e.target.value),
                )
              }
              placeholder={tipoDocumento === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
              inputMode="numeric"
              className={`col-span-2 ${inputCls}`}
            />
          </div>
        </FormField>

        <FormField label="Telefone">
          <input
            value={clienteForm.telefone}
            onChange={(e) => setClienteField('telefone', maskPhoneBR(e.target.value))}
            inputMode="numeric"
            placeholder="(00) 00000-0000"
            className={inputCls}
          />
        </FormField>

        <FormField label="E-mail" colSpan="full">
          <input
            type="email"
            value={clienteForm.email}
            onChange={(e) => setClienteField('email', e.target.value)}
            className={inputCls}
          />
        </FormField>

        <div className="md:col-span-2 border-t border-gray-700 pt-4">
          <h4 className="mb-3 text-base font-semibold text-gray-100">Endereco do cliente</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EnderecoFields
              endereco={clienteForm.endereco}
              onChange={setEnderecoField}
              onCepBlur={handleCepBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
