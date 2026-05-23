import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ClockCounterClockwise, Eye, Hourglass, XCircle } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import {
  approvalsService,
  type ApprovalRequest,
} from '@/features/aprovacoes/services/approvalsService';
import { projectStatusFlow, projectsService } from '@/features/projects/services/projectsService';
import { servicosService } from '@/features/servicos/services/servicosService';
import { getSessionUser, isAdminSessionUser } from '@/shared/session/sessionUser';
import type { Projeto, Servico, StatusProjeto, StatusServico } from '@/types';

type EntitySnapshot = {
  status?: string;
  destinationPath: string;
};

type ApprovalTab = 'pendente' | 'aprovado' | 'rejeitado';

const formatEntityType = (type: ApprovalRequest['entityType']) =>
  type === 'projeto' ? 'Projeto' : 'Servico';

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
    description: 'Solicitacoes aguardando decisao. Ao aprovar ou rejeitar, saem desta lista.',
    emptyMessage: 'Nao ha solicitacoes pendentes no momento.',
    icon: Hourglass,
  },
  aprovado: {
    title: 'Aprovado',
    description: 'Historico das solicitacoes que ja foram aprovadas.',
    emptyMessage: 'Nenhuma solicitacao aprovada ate o momento.',
    icon: CheckCircle,
  },
  rejeitado: {
    title: 'Rejeitado',
    description: 'Historico das solicitacoes que foram rejeitadas.',
    emptyMessage: 'Nenhuma solicitacao rejeitada ate o momento.',
    icon: XCircle,
  },
};

export const AprovacoesPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, EntitySnapshot>>({});
  const [approvalTargets, setApprovalTargets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ApprovalTab>('pendente');

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const bootstrapPendingRequests = async () => {
        const [projetos, servicos] = await Promise.all([
          projectsService.getProjetos().catch(() => []),
          servicosService.list().catch(() => []),
        ]);

        (projetos as Projeto[])
          .filter((projeto) => projeto.status === 'aguardando_aprovacao')
          .forEach((projeto) => {
            approvalsService.ensurePendingRequest({
              entityType: 'projeto',
              entityId: projeto.id,
              entityLabel: projeto.protocolo,
              clientName: projeto.cliente.nome,
              createdAt: projeto.dataCriacao,
            });
          });

        (servicos as Servico[])
          .filter((servico) => servico.status === 'aguardando_aprovacao')
          .forEach((servico) => {
            approvalsService.ensurePendingRequest({
              entityType: 'servico',
              entityId: servico.id,
              entityLabel: servico.protocolo,
              clientName: servico.cliente,
              createdAt: servico.dataCriacao,
            });
          });
      };

      await bootstrapPendingRequests();
      const approvalRequests = approvalsService.list();
      setRequests(approvalRequests);
      setApprovalTargets((current) =>
        approvalRequests.reduce<Record<string, string>>((acc, request) => {
          acc[request.id] =
            current[request.id] ??
            (request.entityType === 'projeto' ? 'em_analise_documentacao' : 'abertura_servico');
          return acc;
        }, {}),
      );

      const nextSnapshots: Record<string, EntitySnapshot> = {};
      await Promise.all(
        approvalRequests.map(async (request) => {
          try {
            if (request.entityType === 'projeto') {
              const projeto = await projectsService.getById(request.entityId);
              nextSnapshots[request.id] = {
                status: projeto.status,
                destinationPath: `/projetos/${request.entityId}`,
              };
              return;
            }

            const servico = await servicosService.getById(request.entityId);
            nextSnapshots[request.id] = {
              status: servico.status,
              destinationPath: `/servicos/${request.entityId}`,
            };
          } catch {
            nextSnapshots[request.id] = {
              destinationPath: request.entityType === 'projeto' ? '/projetos' : '/servicos',
            };
          }
        }),
      );

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

    if (status === 'aprovado') {
      if (request.entityType === 'projeto') {
        const projeto = await projectsService.approvePending(
          request.entityId,
          (approvalTargets[request.id] as StatusProjeto | undefined) ?? 'em_analise_documentacao',
        );
        setSnapshots((current) => ({
          ...current,
          [request.id]: {
            status: projeto.status,
            destinationPath: `/projetos/${request.entityId}`,
          },
        }));
      } else {
        const servico = await servicosService.approvePending(
          request.entityId,
          (approvalTargets[request.id] as StatusServico | undefined) ?? 'abertura_servico',
        );
        setSnapshots((current) => ({
          ...current,
          [request.id]: {
            status: servico.status,
            destinationPath: `/servicos/${request.entityId}`,
          },
        }));
      }
    }

    approvalsService.decide(id, status);
    setRequests(approvalsService.list());
    setActiveTab(status);
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Aprovacoes</h1>
          <p className="mt-1 text-gray-400">Area restrita a usuarios com perfil main.</p>
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
            <th className="px-6 py-4">Status Interno</th>
            <th className="px-6 py-4">Data</th>
            <th className="px-6 py-4 text-right">Acoes</th>
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
                  {snapshots[request.id]?.status ?? formatApprovalStatus(request.status)}
                </span>
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
                      <select
                        value={
                          approvalTargets[request.id] ??
                          (request.entityType === 'projeto'
                            ? 'em_analise_documentacao'
                            : 'abertura_servico')
                        }
                        onChange={(event) =>
                          setApprovalTargets((current) => ({
                            ...current,
                            [request.id]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-200"
                      >
                        {(request.entityType === 'projeto'
                          ? projectStatusFlow.filter(
                              (item) => item.status !== 'aguardando_aprovacao',
                            )
                          : servicosService.statusFlow.filter(
                              (item) => item.status !== 'aguardando_aprovacao',
                            )
                        ).map((item) => (
                          <option key={item.status} value={item.status}>
                            {item.etapa}
                          </option>
                        ))}
                      </select>
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
                        : 'Decisao registrada'}
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
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
          <h1 className="text-3xl font-bold text-slate-100">Aprovacoes de Infraestrutura</h1>
          <p className="mt-2 text-slate-400">
            Gerencie solicitacoes de projetos e vistorias tecnicas do grid.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[rgba(22,31,48,0.7)] px-4 py-3 backdrop-blur-[20px]">
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

          <div className="rounded-2xl border border-white/10 bg-[rgba(22,31,48,0.7)] px-4 py-3 backdrop-blur-[20px]">
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

          <div className="rounded-2xl border border-white/10 bg-[rgba(22,31,48,0.7)] px-4 py-3 backdrop-blur-[20px]">
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

      <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(22,31,48,0.7)] shadow-2xl backdrop-blur-[20px]">
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
              Responsavel atual:{' '}
              <span className="text-slate-100">{sessionUser?.name || 'Main'}</span>
            </div>
          </div>
        </div>

        {renderRows(currentItems, currentTab.emptyMessage)}

        <div className="flex items-center justify-between border-t border-white/5 bg-slate-950/25 px-4 py-4 text-xs text-slate-400">
          <div>
            Exibindo {currentItems.length} solicitacao(oes) na aba {currentTab.title.toLowerCase()}
          </div>
          <div className="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-300">
            {currentItems.length} item(ns)
          </div>
        </div>
      </div>
    </div>
  );
};
