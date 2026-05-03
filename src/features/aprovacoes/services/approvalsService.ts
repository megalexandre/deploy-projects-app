import { getSessionUser } from '../utils/sessionUser';

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

const STORAGE_KEY = 'opj_approval_requests';

const readStorage = (): ApprovalRequest[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as ApprovalRequest[] : [];
  } catch {
    return [];
  }
};

const writeStorage = (items: ApprovalRequest[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const approvalsService = {
  list(): ApprovalRequest[] {
    return readStorage().sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
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

    const current = readStorage();
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

    writeStorage(current);
  },

  decide(id: string, status: Extract<ApprovalStatus, 'aprovado' | 'rejeitado'>) {
    const sessionUser = getSessionUser();
    const current = readStorage();
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

    writeStorage(current);
  }
};
