import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ClockCounterClockwise, Eye, Hourglass, XCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { ApprovalRequest } from '@/features/aprovacoes/services/approvalsService';
import { projectsService } from '@/features/projects/services/projectsService';
import { servicosService } from '@/features/servicos/services/servicosService';
import { getSessionUser, isAdminSessionUser } from '@/shared/session/sessionUser';
import type { Projeto, Servico } from '@/types';

type EntitySnapshot = {
  status?: string;
  destinationPath: string;
};

type ApprovalTab = 'pendente' | 'aprovado' | 'rejeitado';

const formatEntityType = (type: ApprovalRequest['entityType']) =>
  type === 'projeto' ? 'Projeto' : 'Serviço';

const formatApprovalStatus = (status: ApprovalRequest['status']) =>
  status === 'pendente' ? 'Pendente' : status === 'aprovado' ? 'Aprovado' : 'Rejeitado';

const tabConfig: Record<
  ApprovalTab,
  {
    title: string;
    description: string;
    emptyMessage: string;
    icon: React.ComponentType<{ className?: string; weight?: 'fill' | 'regular' }>;
  }
> = {
  pendente: {
    title: 'Aguardando',
    description: 'Solicitações aguardando decisao. Ao aprovar ou rejeitar, saem desta lista.',
    emptyMessage: 'Não há solicitações pendentes no momento.',
    icon: Hourglass,
  },
  aprovado: {
    title: 'Aprovado',
    description: 'Histórico das solicitações que já foram aprovadas.',
    emptyMessage: 'Nenhuma solicitação aprovada até o momento.',
    icon: CheckCircle,
  },
  rejeitado: {
    title: 'Rejeitado',
    description: 'Histórico das solicitações que foram rejeitadas.',
    emptyMessage: 'Nenhuma solicitação rejeitada até o momento.',
    icon: XCircle,
  },
};

export const AprovacoesPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, EntitySnapshot>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ApprovalTab>('pendente');

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [projetos, servicos] = await Promise.all([
        projectsService.getProjetos().catch(() => []),
        servicosService.list().catch(() => []),
      ]);

      const projectRequests: ApprovalRequest[] = (projetos as Projeto[])
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

      const serviceRequests: ApprovalRequest[] = (servicos as Servico[])
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

      const approvalRequests = [...projectRequests, ...serviceRequests].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      setRequests(approvalRequests);

      const nextSnapshots: Record<string, EntitySnapshot> = {};
      projectRequests.forEach((request) => {
        nextSnapshots[request.id] = {
          status: 'aguardando_aprovacao',
          destinationPath: `/projetos/${request.entityId}`,
        };
      });
      serviceRequests.forEach((request) => {
        nextSnapshots[request.id] = {
          status: 'aguardando_aprovacao',
          destinationPath: `/servicos/${request.entityId}`,
        };
      });

      setSnapshots(nextSnapshots);
      setLoading(false);
    };

    void load();
  }, []);

  const pendingRequests = useMemo(
    () => requests.filter((item) => item.status === 'pendente'),
    [requests],
  );
  const approvedRequests = useMemo(
    () => requests.filter((item) => item.status === 'aprovado'),
    [requests],
  );
  const rejectedRequests = useMemo(
    () => requests.filter((item) => item.status === 'rejeitado'),
    [requests],
  );

  const requestsByTab: Record<ApprovalTab, ApprovalRequest[]> = {
    pendente: pendingRequests,
    aprovado: approvedRequests,
    rejeitado: rejectedRequests,
  };

  const sessionUser = getSessionUser();
  const isAdmin = isAdminSessionUser();

  const handleDecision = async (id: string, status: 'aprovado' | 'rejeitado') => {
    const request = requests.find((item) => item.id === id);
    if (!request) return;

    if (request.entityType === 'projeto') {
      if (status === 'aprovado') {
        await projectsService.approvePending(request.entityId);
      } else {
        await projectsService.updateStatus(
          request.entityId,
          'projeto_encerrado',
          'Solicitacao rejeitada na tela de aprovacoes.',
        );
      }
    } else if (status === 'aprovado') {
      await servicosService.approvePending(request.entityId);
    } else {
      await servicosService.updateStatus(request.entityId, 'servico_encerrado');
    }

    setRequests((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              decidedAt: new Date().toISOString(),
              decidedByUserId: sessionUser?.id,
              decidedByName: sessionUser?.name,
            }
          : item,
      ),
    );
    setActiveTab(status);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Aprovações</h1>
          <p className="mt-1 text-gray-400">Área restrita a usuários com perfil main.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  const currentItems = requestsByTab[activeTab];
  const currentTab = tabConfig[activeTab];

  const renderRows = (items: ApprovalRequest[], emptyMessage: string) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-slate-950/40">
          <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
            <th className="px-6 py-4">Projeto / ID</th>
            <th className="px-6 py-4">Cliente</th>
            <th className="px-6 py-4">Solicitante</th>
            <th className="px-6 py-4">Aprovação</th>
            <th className="px-6 py-4">Status Kanban</th>
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((request) => (
            <tr key={request.id} className="bg-slate-950/15 transition-colors hover:bg-white/5">
              <td className="px-6 py-6">
                <div>
                  <p className="font-bold text-slate-100">{request.entityLabel}</p>
                  <p className="text-xs text-slate-400">{formatEntityType(request.entityType)}</p>
                </div>
              </td>
              <td className="px-6 py-6">
                <div className="flex flex-col">
                  <span className="text-slate-100">{request.clientName}</span>
                  <span className="text-xs text-slate-500">ID: {request.entityId}</span>
                </div>
              </td>
              <td className="px-6 py-6">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/20 text-[10px] font-bold text-sky-200">
                    {(request.createdByName || 'M').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm text-slate-100">{request.createdByName}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      {request.createdByRole}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-6">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-tight ${
                    request.status === 'pendente'
                      ? 'border-amber-400/20 bg-amber-400/10 text-amber-200'
                      : request.status === 'aprovado'
                        ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                        : 'border-rose-400/20 bg-rose-400/10 text-rose-200'
                  }`}
                >
                  {formatApprovalStatus(request.status)}
                </span>
              </td>
              <td className="px-6 py-6 text-sm text-slate-300">
                {snapshots[request.id]?.status ?? '-'}
              </td>
              <td className="px-6 py-6 text-sm text-slate-400">
                {new Date(request.createdAt).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-6 py-6">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Link
                    to={
                      snapshots[request.id]?.destinationPath ??
                      (request.entityType === 'projeto' ? '/projetos' : '/servicos')
                    }
                  >
                    <button className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-800 hover:text-cyan-300">
                      <Eye className="h-5 w-5" />
                    </button>
                  </Link>

                  {request.status === 'pendente' ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-cyan-400 text-slate-950 hover:brightness-95"
                        onClick={() => handleDecision(request.id, 'aprovado')}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => handleDecision(request.id, 'rejeitado')}
                      >
                        Rejeitar
                      </Button>
                    </>
                  ) : (
                    <div className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400">
                      <ClockCounterClockwise className="mr-2 h-4 w-4" />
                      {request.decidedByName
                        ? `Decidido por ${request.decidedByName}`
                        : 'Decisão registrada'}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-12 text-center text-sm text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 page-enter">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Aprovações de Infraestrutura</h1>
          <p className="mt-2 text-slate-400">
            Gerencie solicitações de projetos e vistorias técnicas do grid.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-[20px]">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-400/10 p-2">
                <Hourglass className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Aguardando
                </p>
                <p className="text-xl font-bold text-amber-300">{pendingRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-[20px]">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-400/10 p-2">
                <CheckCircle className="h-5 w-5 text-cyan-300" weight="fill" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Aprovados
                </p>
                <p className="text-xl font-bold text-cyan-300">{approvedRequests.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 backdrop-blur-[20px]">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-rose-400/10 p-2">
                <XCircle className="h-5 w-5 text-rose-300" weight="fill" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rejeitados
                </p>
                <p className="text-xl font-bold text-rose-300">{rejectedRequests.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 shadow-2xl backdrop-blur-[20px]">
        <div className="flex border-b border-white/10 px-6 pt-6">
          {(Object.keys(tabConfig) as ApprovalTab[]).map((tab) => {
            const Icon = tabConfig[tab].icon;
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm transition-all ${
                  isActive
                    ? 'border-b-2 border-cyan-300 pb-4 font-bold text-cyan-300'
                    : 'font-medium text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tabConfig[tab].title}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">{currentTab.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{currentTab.description}</p>
            </div>
            <div className="text-sm text-slate-400">
              Responsável atual:{' '}
              <span className="text-slate-100">{sessionUser?.name || 'Main'}</span>
            </div>
          </div>
        </div>

        {renderRows(currentItems, currentTab.emptyMessage)}

        <div className="flex items-center justify-between border-t border-white/5 bg-slate-950/25 px-4 py-4 text-xs text-slate-400">
          <div>
            Exibindo {currentItems.length} solicitação(ões) na aba {currentTab.title.toLowerCase()}
          </div>
          <div className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-300">
            {currentItems.length} item(ns)
          </div>
        </div>
      </div>
    </div>
  );
};
