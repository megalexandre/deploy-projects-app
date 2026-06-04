import React from 'react';
import { EnvelopeSimple, TrashSimple } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import type { User as SystemUser } from '@/services';
import { formatRoleLabel, formatUserDate } from '../hooks/useUsers';

type Props = {
  users: SystemUser[];
  onDelete: (user: SystemUser) => void;
};

export const UserListCard: React.FC<Props> = ({ users, onDelete }) => (
  <Card>
    <CardHeader>
      <CardTitle>Lista de Usuários</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-4 py-3 text-left font-medium text-gray-300">Nome</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Perfil</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Criado em</th>
              <th className="px-4 py-3 text-left font-medium text-gray-300">Atualizado em</th>
              <th className="px-4 py-3 text-right font-medium text-gray-300">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((usuario) => (
              <tr key={usuario.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                      {usuario.name
                        .split(' ')
                        .map((name) => name[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="text-gray-100 font-medium">{usuario.name}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center text-gray-100">
                    <EnvelopeSimple className="mr-2 h-4 w-4 text-gray-400" />
                    {usuario.email}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-100">{formatRoleLabel(usuario.role)}</td>
                <td className="px-4 py-3 text-gray-100">{formatUserDate(usuario.createdAt)}</td>
                <td className="px-4 py-3 text-gray-100">{formatUserDate(usuario.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-red-700 text-red-400 hover:bg-red-900/30"
                    onClick={() => onDelete(usuario)}
                  >
                    <TrashSimple className="mr-2 h-4 w-4" />
                    Deletar
                  </Button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                  Nenhum usuário encontrado para os filtros atuais.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
