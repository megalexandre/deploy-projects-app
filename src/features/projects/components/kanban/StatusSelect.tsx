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
    className="min-w-0 flex-1 rounded-lg border border-white/20 bg-slate-950/70 px-2 py-1 text-xs text-slate-200"
  >
    {columns.map((column) => (
      <option key={column.id} value={column.id}>
        {column.label}
      </option>
    ))}
  </select>
);
