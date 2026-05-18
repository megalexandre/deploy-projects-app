import React from 'react';
import { CheckCircleIcon, ClockIcon, FolderOpenIcon, TrendUpIcon } from '@phosphor-icons/react';
import type { DashboardStats } from '@/types';
import { DashboardStatCard } from './DashboardStatCard';

interface DashboardStatsGridProps {
  stats: DashboardStats | null;
}

export const DashboardStatsGrid: React.FC<DashboardStatsGridProps> = ({ stats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <DashboardStatCard
      icon={<FolderOpenIcon className="h-8 w-8 text-opj-blue" />}
      label="Total de Projetos"
      value={stats?.totalProjetos ?? 0}
    />
    <DashboardStatCard
      icon={<ClockIcon className="h-8 w-8 text-opj-orange" />}
      label="Em Andamento"
      value={stats?.projetosEmAndamento ?? 0}
    />
    <DashboardStatCard
      icon={<CheckCircleIcon className="h-8 w-8 text-green-500" />}
      label="Concluídos"
      value={stats?.projetosFinalizados ?? 0}
    />
    <DashboardStatCard
      icon={<TrendUpIcon className="h-8 w-8 text-yellow-500" />}
      label="Pendentes"
      value={stats?.projetosPendentes ?? 0}
    />
  </div>
);
