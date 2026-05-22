import React from 'react';
import { columns, toKanbanStatus, type KanbanStatus } from '../../kanban/kanbanConfig';
import type { Projeto } from '@/types';

interface StatusSelectProps {
  projectId: Projeto['id'];
  status: Projeto['status'];
  canManageStatus: boolean;
  onStatusChange: (projectId: string, nextStatus: KanbanStatus) => void;
}

export const StatusSelect: React.FC<StatusSelectProps> = ({
  projectId,
  status,
  canManageStatus,
  onStatusChange,
}) => (
  <select
    value={toKanbanStatus(status)}
    onChange={(event) => {
      if (!canManageStatus) return;
      onStatusChange(projectId, event.target.value as KanbanStatus);
    }}
    disabled={!canManageStatus}
    className="min-w-0 w-full appearance-none border-0 bg-transparent px-0 py-0 text-center text-sm font-semibold text-slate-300 outline-none disabled:cursor-default"
  >
    {columns.map((column) => (
      <option key={column.id} value={column.id}>
        {column.label}
      </option>
    ))}
  </select>
);
