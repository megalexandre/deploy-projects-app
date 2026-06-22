import { ClipboardTextIcon, EyeIcon } from '@phosphor-icons/react';
import type { ApprovalRequest } from '@/features/aprovacoes/services/approvalsService';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import React from 'react';
import { Link } from 'react-router-dom';

interface RecentApprovalsCardProps {
  approvals: ApprovalRequest[];
}

const getApprovalTypeText = (type: ApprovalRequest['entityType']) =>
  type === 'projeto' ? 'Projeto' : 'Serviço';

const getDestinationPath = (approval: ApprovalRequest) =>
  approval.entityType === 'projeto'
    ? `/projetos/${approval.entityId}`
    : `/servicos/${approval.entityId}`;

export const RecentApprovalsCard: React.FC<RecentApprovalsCardProps> = ({ approvals }) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Últimos a Serem Aprovados</CardTitle>
        <Link to="/aprovacoes">
          <Button variant="outline" size="sm">
            Ver Aprovações
          </Button>
        </Link>
      </div>
    </CardHeader>
    <CardContent>
      {approvals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-gray-400">
          Nenhuma solicitação pendente de aprovação no momento.
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-cyan-200">
                  <ClipboardTextIcon className="h-4 w-4" />
                  <span>{getApprovalTypeText(approval.entityType)}</span>
                </div>
                <p className="mt-1 text-sm font-semibold text-gray-100">{approval.entityLabel}</p>
                <p className="mt-1 text-sm text-gray-300">{approval.clientName}</p>
                <p className="mt-1 text-xs text-gray-400">
                  Solicitado por {approval.createdByName} em{' '}
                  {new Date(approval.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={getDestinationPath(approval)}>
                  <Button variant="outline" size="sm">
                    <EyeIcon className="mr-1 h-4 w-4" />
                    Abrir
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);
