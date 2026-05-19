import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Card, CardContent } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { formatRoleLabel } from '../hooks/useUsers';

type Props = {
  searchTerm: string;
  selectedRole: string;
  roleOptions: string[];
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
};

export const UserFiltersCard: React.FC<Props> = ({
  searchTerm,
  selectedRole,
  roleOptions,
  onSearchChange,
  onRoleChange,
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            icon={<MagnifyingGlass />}
          />
        </div>
        <select
          value={selectedRole}
          onChange={(event) => onRoleChange(event.target.value)}
          className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role === 'todos' ? 'Todos os perfis' : formatRoleLabel(role)}
            </option>
          ))}
        </select>
      </div>
    </CardContent>
  </Card>
);
