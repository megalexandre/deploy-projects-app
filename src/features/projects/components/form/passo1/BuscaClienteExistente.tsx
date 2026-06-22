import { formatDocumento, formatTelefone } from '@/features/projects/hooks/useNovoProjeto';
import type { Customer } from '@/services';
import { MagnifyingGlass } from '@phosphor-icons/react';
import React from 'react';
import { inputCls } from '../fieldCls';

interface BuscaClienteExistenteProps {
  buscaCliente: string;
  setBuscaCliente: (v: string) => void;
  clientesFiltrados: Customer[];
  clientesLoading: boolean;
  clienteSelecionadoId: string | null;
  setClienteSelecionadoId: (id: string | null) => void;
}

export const BuscaClienteExistente: React.FC<BuscaClienteExistenteProps> = ({
  buscaCliente,
  setBuscaCliente,
  clientesFiltrados,
  clientesLoading,
  clienteSelecionadoId,
  setClienteSelecionadoId,
}) => (
  <div className="rounded-lg border border-gray-700 p-4 space-y-4">
    <h3 className="text-lg font-semibold text-gray-100">Selecionar cliente cadastrado</h3>

    <div className="relative">
      <input
        value={buscaCliente}
        onChange={(e) => setBuscaCliente(e.target.value)}
        placeholder="Pesquisar por nome, CPF/CNPJ, telefone ou email"
        className={`${inputCls} pl-10`}
      />
      <MagnifyingGlass className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>

    {clientesLoading && <p className="text-sm text-gray-300">Carregando clientes...</p>}

    {!clientesLoading && (
      <div className="max-h-64 overflow-auto space-y-2">
        {clientesFiltrados.map((cliente) => (
          <button
            type="button"
            key={cliente.id}
            onClick={() => setClienteSelecionadoId(cliente.id)}
            className={`w-full rounded border px-3 py-3 text-left transition-colors ${
              clienteSelecionadoId === cliente.id
                ? 'border-blue-500 bg-blue-900/25 text-blue-100'
                : 'border-gray-700 bg-gray-800 text-gray-200 hover:border-gray-500'
            }`}
          >
            <p className="font-semibold">{cliente.nome}</p>
            <p className="text-sm text-gray-300">{formatDocumento(cliente.cpfCnpj)}</p>
            <p className="text-sm text-gray-300">{formatTelefone(cliente.telefone)}</p>
            <p className="text-sm text-gray-300">{cliente.email}</p>
          </button>
        ))}
        {clientesFiltrados.length === 0 && (
          <p className="text-sm text-gray-300">
            Nenhum cliente encontrado para o filtro informado.
          </p>
        )}
      </div>
    )}
  </div>
);
