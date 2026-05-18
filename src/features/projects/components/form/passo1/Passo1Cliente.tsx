import type {
  ClienteForm,
  EnderecoForm,
  ModoCliente,
  Passo,
  TipoDocumento,
} from '@/features/projects/domain/types';
import type { Customer } from '@/services';
import { Button } from '@/shared/components/Button';
import React from 'react';
import { BuscaClienteExistente } from './BuscaClienteExistente';
import { NovoClienteForm } from './NovoClienteForm';
import { SelectionCard } from '../SelectionCard';

interface Passo1ClienteProps {
  modoCliente: ModoCliente | null;
  setModoCliente: (v: ModoCliente) => void;
  tipoDocumento: TipoDocumento;
  setTipoDocumento: (v: TipoDocumento) => void;
  clienteForm: ClienteForm;
  setClienteForm: React.Dispatch<React.SetStateAction<ClienteForm>>;
  clientesFiltrados: Customer[];
  clientesLoading: boolean;
  clienteSelecionadoId: string | null;
  setClienteSelecionadoId: (id: string | null) => void;
  buscaCliente: string;
  setBuscaCliente: (v: string) => void;
  fillAddressFromCep: (
    cep: string,
    callback: (endereco: Omit<EnderecoForm, 'numero'>) => void,
  ) => Promise<void>;
  validarPasso1: () => boolean;
  setPassoAtual: (p: Passo) => void;
  setErro: (e: string | null) => void;
}

export const Passo1Cliente: React.FC<Passo1ClienteProps> = ({
  modoCliente,
  setModoCliente,
  tipoDocumento,
  setTipoDocumento,
  clienteForm,
  setClienteForm,
  clientesFiltrados,
  clientesLoading,
  clienteSelecionadoId,
  setClienteSelecionadoId,
  buscaCliente,
  setBuscaCliente,
  fillAddressFromCep,
  validarPasso1,
  setPassoAtual,
  setErro,
}) => (
  <div className="space-y-6 page-enter">
    <h2 className="text-2xl font-bold text-gray-100">Cliente do Projeto</h2>

    <div className="rounded-lg border border-gray-700 p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-100">Tipo de cliente</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SelectionCard
          active={modoCliente === 'novo'}
          onClick={() => {
            setModoCliente('novo');
            setClienteSelecionadoId(null);
            setBuscaCliente('');
            setErro(null);
          }}
          title="Novo cliente"
          description="Cadastrar cliente e criar projeto em seguida."
        />
        <SelectionCard
          active={modoCliente === 'existente'}
          onClick={() => {
            setModoCliente('existente');
            setErro(null);
          }}
          title="Cliente ja cadastrado"
          description="Selecionar um cliente existente da base."
        />
      </div>
    </div>

    {modoCliente === 'novo' && (
      <NovoClienteForm
        tipoDocumento={tipoDocumento}
        setTipoDocumento={setTipoDocumento}
        clienteForm={clienteForm}
        setClienteForm={setClienteForm}
        fillAddressFromCep={fillAddressFromCep}
      />
    )}

    {modoCliente === 'existente' && (
      <BuscaClienteExistente
        buscaCliente={buscaCliente}
        setBuscaCliente={setBuscaCliente}
        clientesFiltrados={clientesFiltrados}
        clientesLoading={clientesLoading}
        clienteSelecionadoId={clienteSelecionadoId}
        setClienteSelecionadoId={setClienteSelecionadoId}
      />
    )}

    <div className="flex justify-end">
      <Button
        onClick={() => {
          if (!validarPasso1()) {
            setErro('Preencha os campos obrigatorios do cliente para avancar para Passo 2.');
            return;
          }
          setErro(null);
          setPassoAtual(2);
        }}
      >
        Proximo Passo
      </Button>
    </div>
  </div>
);
