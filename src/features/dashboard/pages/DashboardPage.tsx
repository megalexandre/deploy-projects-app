/** Pagina 'DashboardPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  TrendUp,
  CheckCircle,
  Clock,
  PlusCircle,
  Eye,
  ClipboardText,
} from '@phosphor-icons/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { projectsService } from '@/services';
import {
  approvalsService,
  type ApprovalRequest,
} from '@/features/aprovacoes/services/approvalsService';
import type { DashboardStats, Projeto } from '@/types';

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'text-green-400';
      case 'em_andamento':
        return 'text-opj-orange';
      case 'pendente':
        return 'text-yellow-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      case 'aprovado':
        return 'Aprovado';
      default:
        return status;
    }
  };

  const getApprovalTypeText = (type: ApprovalRequest['entityType']) =>
    type === 'projeto' ? 'Projeto' : 'Servico';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-alumni-bold text-gray-100">Dashboard</h1>
          <p className="text-gray-400 mt-1">Visão geral dos projetos fotovoltaicos</p>
        </div>
        <Link to="/projetos/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="h-8 w-8 text-opj-blue" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total de Projetos</p>
                <p className="text-2xl font-bold text-gray-100">{stats?.totalProjetos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-opj-orange" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Em Andamento</p>
                <p className="text-2xl font-bold text-gray-100">
                  {stats?.projetosEmAndamento || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Concluídos</p>
                <p className="text-2xl font-bold text-gray-100">
                  {stats?.projetosFinalizados || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendUp className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-gray-100">{stats?.projetosPendentes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Ultimos a Serem Aprovados</CardTitle>
            <Link to="/aprovacoes">
              <Button variant="outline" size="sm">
                Ver Aprovacoes
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentApprovals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-400">
              Nenhuma solicitacao pendente de aprovacao no momento.
            </div>
          ) : (
            <div className="space-y-3">
              {recentApprovals.map((approval) => {
                const destinationPath =
                  approval.entityType === 'projeto'
                    ? `/projetos/${approval.entityId}`
                    : `/servicos/${approval.entityId}`;

                return (
                  <div
                    key={approval.id}
                    className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-cyan-200">
                        <ClipboardText className="h-4 w-4" />
                        <span>{getApprovalTypeText(approval.entityType)}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-100">
                        {approval.entityLabel}
                      </p>
                      <p className="mt-1 text-sm text-gray-300">{approval.clientName}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        Solicitado por {approval.createdByName} em{' '}
                        {new Date(approval.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={destinationPath}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-1 h-4 w-4" />
                          Abrir
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Projetos Recentes</CardTitle>
            <Link to="/projetos">
              <Button variant="outline" size="sm">
                Ver Todos
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Concessionária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Potência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                      {project.protocolo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {project.cliente.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {project.dadosProjeto.concessionaria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {project.dadosProjeto.potenciaSistema} kWp
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-medium ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Link to={`/projetos/${project.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
