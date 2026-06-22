import React from 'react';
import { PencilSimple, UploadSimple } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import type { Customer } from '@/services';
import { formatDocumento, formatTelefone } from '../hooks/useClientes';

type Props = {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onOpenDocuments: (customer: Customer) => void;
};

export const CustomerListCard: React.FC<Props> = ({ customers, onEdit, onOpenDocuments }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-4">
        <CardTitle>Clientes Cadastrados ({customers.length})</CardTitle>
        <span className="text-sm text-slate-400">
          Visualizacao resumida com contato e localizacao.
        </span>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Localizacao</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((cliente) => (
              <tr key={cliente.id} className="text-sm text-slate-200">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-900/60 text-sm font-semibold text-cyan-200">
                      {cliente.nome.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{cliente.nome}</div>
                      <div className="text-xs text-slate-400">
                        {formatDocumento(cliente.cpfCnpj)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div>{formatTelefone(cliente.telefone)}</div>
                    <div className="text-xs text-slate-400">{cliente.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    <div className="font-medium text-slate-100">
                      {cliente.endereco?.cidade
                        ? `${cliente.endereco.cidade}/${cliente.endereco.estado}`
                        : '-'}
                    </div>
                    <div className="max-w-xs text-xs text-slate-400">
                      {cliente.enderecoCompleto ||
                        [
                          cliente.endereco?.logradouro,
                          cliente.endereco?.numero,
                          cliente.endereco?.bairro,
                        ]
                          .filter(Boolean)
                          .join(', ') ||
                        '-'}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void onOpenDocuments(cliente)}
                    >
                      <UploadSimple className="mr-2 h-4 w-4" />
                      Documentos
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(cliente)}
                    >
                      <PencilSimple className="mr-2 h-4 w-4" />
                      Editar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={6}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
