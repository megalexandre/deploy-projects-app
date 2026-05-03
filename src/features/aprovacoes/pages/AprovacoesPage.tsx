import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle, ClockCounterClockwise, Eye, Prohibit } from '@phosphor-icons/react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/Button';
import { Card, CardContent } from '@/shared/components/Card';
import { approvalsService, type ApprovalRequest } from '@/features/aprovacoes/services/approvalsService';
import { projectsService } from '@/features/projetos/services/projectsService';
import { servicosService } from '@/features/servicos/services/servicosService';
import { getSessionUser, isAdminSessionUser } from '@/shared/session/sessionUser';

type EntitySnapshot = {
  status?: string;
  destinationPath: string;
};

const formatEntityType = (type: ApprovalRequest['entityType']) => (type === 'projeto' ? 'Projeto' : 'Servico');
const formatApprovalStatus = (status: ApprovalRequest['status']) =>
  status === 'pendente' ? 'Pendente' : status === 'aprovado' ? 'Aprovado' : 'Rejeitado';

export const AprovacoesPage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, EntitySnapshot>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const approvalRequests = approvalsService.list();
      setRequests(approvalRequests);

      const nextSnapshots: Record<string, EntitySnapshot> = {};
      await Promise.all(
        approvalRequests.map(async (request) => {
          try {
            if (request.entityType === 'projeto') {
              const projeto = await projectsService.getById(request.entityId);
              nextSnapshots[request.id] = {
                status: projeto.status,
                destinationPath: `/projetos/${request.entityId}`
              };
              return;
            }

            const servico = await servicosService.getById(request.entityId);
            nextSnapshots[request.id] = {
              status: servico.status,
              destinationPath: `/servicos/${request.entityId}`
            };
          } catch {
            nextSnapshots[request.id] = {
              destinationPath: request.entityType === 'projeto' ? '/projetos' : '/servicos'
            };
          }
        })
      );

      setSnapshots(nextSnapshots);
      setLoading(false);
    };

    void load();
  }, []);

  const pendingCount = useMemo(() => requests.filter((item) => item.status === 'pendente').length, [requests]);
  const approvedCount = useMemo(() => requests.filter((item) => item.status === 'aprovado').length, [requests]);
  const rejectedCount = useMemo(() => requests.filter((item) => item.status === 'rejeitado').length, [requests]);
  const sessionUser = getSessionUser();
  const isAdmin = isAdminSessionUser();

  const handleDecision = (id: string, status: 'aprovado' | 'rejeitado') => {
    approvalsService.decide(id, status);
    setRequests(approvalsService.list());
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Aprovacoes</h1>
          <p className="mt-1 text-gray-400">Area restrita a usuarios com perfil administrador.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" /></div>;
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Aprovacoes</h1>
          <p className="mt-1 text-gray-400">
            Solicita aprovacao para projetos e servicos criados por usuarios sem role `admin`.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          Responsavel atual: <span className="text-slate-100">{sessionUser?.name || 'Administrador'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Pendentes</div><div className="mt-2 text-3xl font-semibold text-amber-300">{pendingCount}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aprovados</div><div className="mt-2 text-3xl font-semibold text-emerald-300">{approvedCount}</div></CardContent></Card>
        <Card><CardContent className="p-5"><div className="text-xs uppercase tracking-[0.18em] text-slate-400">Rejeitados</div><div className="mt-2 text-3xl font-semibold text-rose-300">{rejectedCount}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-slate-950/50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Registro</th>
                  <th className="px-5 py-4">Cliente</th>
                  <th className="px-5 py-4">Solicitante</th>
                  <th className="px-5 py-4">Status Atual</th>
                  <th className="px-5 py-4">Aprovacao</th>
                  <th className="px-5 py-4">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {requests.map((request) => (
                  <tr key={request.id} className="bg-slate-950/20">
                    <td className="px-5 py-4 text-sm text-slate-200">{formatEntityType(request.entityType)}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-slate-100">{request.entityLabel}</div>
                      <div className="text-xs text-slate-400">{new Date(request.createdAt).toLocaleString('pt-BR')}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{request.clientName}</td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-slate-200">{request.createdByName}</div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">{request.createdByRole}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-300">{snapshots[request.id]?.status ?? '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${
                        request.status === 'pendente'
                          ? 'bg-amber-500/15 text-amber-200'
                          : request.status === 'aprovado'
                            ? 'bg-emerald-500/15 text-emerald-200'
                            : 'bg-rose-500/15 text-rose-200'
                      }`}>
                        {formatApprovalStatus(request.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link to={snapshots[request.id]?.destinationPath ?? (request.entityType === 'projeto' ? '/projetos' : '/servicos')}>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            Abrir
                          </Button>
                        </Link>
                        {request.status === 'pendente' && (
                          <>
                            <Button type="button" size="sm" onClick={() => handleDecision(request.id, 'aprovado')}>
                              <CheckCircle className="mr-1 h-4 w-4" />
                              Aprovar
                            </Button>
                            <Button type="button" variant="outline" size="sm" className="text-rose-300 hover:text-rose-200" onClick={() => handleDecision(request.id, 'rejeitado')}>
                              <Prohibit className="mr-1 h-4 w-4" />
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {request.status !== 'pendente' && (
                          <div className="inline-flex items-center rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-400">
                            <ClockCounterClockwise className="mr-2 h-4 w-4" />
                            {request.decidedByName ? `Decidido por ${request.decidedByName}` : 'Decisao registrada'}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                      Nenhuma solicitacao de aprovacao registrada ate o momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
