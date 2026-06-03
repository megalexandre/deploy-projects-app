import React from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Input } from '@/shared/components/Input';
import { Card, CardContent } from '@/shared/components/Card';
import { columns, type KanbanStatus } from '../kanban/kanbanConfig';

type Props = {
  searchTerm: string;
  statusFilter: 'todos' | KanbanStatus;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'todos' | KanbanStatus) => void;
};

export const ProjetosFilter: React.FC<Props> = ({
  searchTerm,
  statusFilter,
  onSearchChange,
  onStatusChange,
}) => (
  <Card>
    <CardContent className="p-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_280px]">
        <Input
          placeholder="Buscar por protocolo, cliente ou concessionária..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          icon={<MagnifyingGlass />}
        />
        <select
          value={statusFilter}
          onChange={(event) => onStatusChange(event.target.value as 'todos' | KanbanStatus)}
          className="h-[46px] w-full rounded-xl border border-white/20 bg-slate-900/50 px-3 text-sm text-slate-100 outline-none transition-colors duration-200 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/35"
        >
          <option value="todos">Todos os status</option>
          {columns.map((column) => (
            <option key={column.id} value={column.id}>
              {column.label}
            </option>
          ))}
        </select>
      </div>
    </CardContent>
  </Card>
);
