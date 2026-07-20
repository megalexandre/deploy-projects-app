import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircleIcon } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { projectsService } from '@/services';
import type { ApprovalRequest } from '@/features/aprovacoes/services/approvalsService';
import { servicosService } from '@/features/servicos/services/servicosService';
import type { DashboardStats, Projeto, Servico } from '@/types';
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
        const servicesData = await servicosService.list().catch(() => []);
        const pendingProjectApprovals: ApprovalRequest[] = projectsData
          .filter((projeto) => projeto.status === 'aguardando_aprovacao')
          .map((projeto) => ({
            id: `projeto-${projeto.id}`,
            entityType: 'projeto',
            entityId: projeto.id,
            entityLabel: projeto.protocolo,
            clientName: projeto.cliente.nome,
            createdAt: projeto.dataCriacao,
            createdByUserId: 'backend',
            createdByName: 'API',
            createdByRole: 'backend',
            status: 'pendente',
          }));
        const pendingServiceApprovals: ApprovalRequest[] = (servicesData as Servico[])
          .filter((servico) => servico.status === 'aguardando_aprovacao')
          .map((servico) => ({
            id: `servico-${servico.id}`,
            entityType: 'servico',
            entityId: servico.id,
            entityLabel: servico.protocolo,
            clientName: servico.cliente,
            createdAt: servico.dataCriacao,
            createdByUserId: 'backend',
            createdByName: 'API',
            createdByRole: 'backend',
            status: 'pendente',
          }));

        setStats(statsData);
        setRecentProjects(projectsData.slice(0, 5));
        setRecentApprovals(
          [...pendingProjectApprovals, ...pendingServiceApprovals]
            .sort(
              (left, right) =>
                new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
            )
            .slice(0, 5),
        );
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
          <p className="text-gray-400 mt-1">Visão geral dos projetos</p>
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
