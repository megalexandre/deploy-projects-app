import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { projectsService } from '@/services';
import {
  approvalsService,
  type ApprovalRequest,
} from '@/features/aprovacoes/services/approvalsService';
import type { DashboardStats, Projeto } from '@/types';
import { DashboardStatsGrid } from '../components/DashboardStatsGrid';
import { RecentApprovalsCard } from '../components/RecentApprovalsCard';
import { RecentProjectsCard } from '../components/RecentProjectsCard';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Projeto[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, projectsData] = await Promise.all([
          projectsService.getDashboardStats(),
          projectsService.getProjetos(),
        ]);

        setStats(statsData);
        setRecentProjects(projectsData.slice(0, 5));
        setRecentApprovals(approvalsService.listPending().slice(0, 5));
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-alumni-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 mt-1">Visão geral dos projetos fotovoltaicos</p>
        </div>
        <Link to="/projetos/novo">
          <Button>
            <PlusCircleIcon className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      <DashboardStatsGrid stats={stats} />
      <RecentApprovalsCard approvals={recentApprovals} />
      <RecentProjectsCard projects={recentProjects} />
    </div>
  );
};
