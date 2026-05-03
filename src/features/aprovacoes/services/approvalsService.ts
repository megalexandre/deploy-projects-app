import { createArrayStorage } from '@/core/utils/storage';
import { getSessionUser } from '@/shared/session/sessionUser';

export type ApprovalEntityType = 'projeto' | 'servico';
export type ApprovalStatus = 'pendente' | 'aprovado' | 'rejeitado';

export interface ApprovalRequest {
  id: string;
  entityType: ApprovalEntityType;
  entityId: string;
  entityLabel: string;
  clientName: string;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
  createdByRole: string;
  status: ApprovalStatus;
  decidedAt?: string;
  decidedByUserId?: string;
  decidedByName?: string;
}

const storage = createArrayStorage<ApprovalRequest>('opj_approval_requests');

export const approvalsService = {
  list(): ApprovalRequest[] {
    return storage.read().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  },

  listPending(): ApprovalRequest[] {
    return approvalsService.list().filter((item) => item.status === 'pendente');
  },

  createForNonAdmin(input: {
    entityType: ApprovalEntityType;
    entityId: string;
    entityLabel: string;
    clientName: string;
  }) {
    const sessionUser = getSessionUser();
    if (!sessionUser || sessionUser.role === 'admin') {
      return;
    }

    const current = storage.read();
    const existingIndex = current.findIndex(
      (item) => item.entityType === input.entityType && item.entityId === input.entityId
    );

    const request: ApprovalRequest = {
      id: existingIndex >= 0 ? current[existingIndex].id : crypto.randomUUID(),
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      clientName: input.clientName,
      createdAt: existingIndex >= 0 ? current[existingIndex].createdAt : new Date().toISOString(),
      createdByUserId: sessionUser.id,
      createdByName: sessionUser.name,
      createdByRole: sessionUser.role,
      status: 'pendente'
    };

    if (existingIndex >= 0) {
      current[existingIndex] = request;
    } else {
      current.unshift(request);
    }

    storage.write(current);
  },

  decide(id: string, status: Extract<ApprovalStatus, 'aprovado' | 'rejeitado'>) {
    const sessionUser = getSessionUser();
    const current = storage.read();
    const index = current.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }

    current[index] = {
      ...current[index],
      status,
      decidedAt: new Date().toISOString(),
      decidedByUserId: sessionUser?.id,
      decidedByName: sessionUser?.name
    };

    storage.write(current);
  }
};
