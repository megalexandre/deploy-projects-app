import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/api/apiClient';
import { addressService } from '@/shared/api/addressService';
import { filesService } from '@/shared/api/filesService';
import { customersService } from '@/features/clientes/services/customersService';
import { concessionairesService } from '@/features/concessionaries/services/concessionairesService';
import { servicosService } from './servicosService';

vi.mock('@/shared/api/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/shared/api/addressService', () => ({
  addressService: {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('@/shared/api/filesService', () => ({
  filesService: {
    listByItem: vi.fn(),
  },
}));

vi.mock('@/features/clientes/services/customersService', () => ({
  customersService: {
    getAll: vi.fn(),
  },
}));

vi.mock('@/features/concessionaries/services/concessionairesService', () => ({
  concessionairesService: {
    getAll: vi.fn(),
  },
}));

const timeline = [
  {
    id: 'timeline-1',
    etapa: 'Abertura do Serviço',
    data: '2026-10-03T12:00:00.000Z',
    status: 'em_andamento',
    descricao: 'Etapa inicial',
  },
];

const backendService = {
  id: 'service-1',
  service_type: 'ligacao_nova',
  customer_id: 'customer-1',
  concessionaire_id: 'concessionaire-1',
  opening_date: '2026-10-03',
  amount: '1000',
  discount_coupon_percentage: 10,
  protocol: 'SERV-2026-00001',
  status: 'abertura_servico',
  timeline: JSON.stringify(timeline),
  timeline_comments: '{}',
  reference_point: 'Próximo à praça',
  approval_status: 'pending',
  document_category: '{}',
  reused_documents: '[]',
  apportionments: [],
  service_entry_items: [],
  created_at: '2026-10-03T12:00:00.000Z',
  updated_at: '2026-10-03T12:00:00.000Z',
};

describe('servicosService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(customersService.getAll).mockResolvedValue([
      {
        id: 'customer-1',
        nome: 'Cliente',
        cpfCnpj: '00000000000',
        telefone: '31999999999',
        email: 'cliente@example.com',
        documentos: [],
      },
    ]);
    vi.mocked(concessionairesService.getAll).mockResolvedValue([
      { id: 'concessionaire-1', name: 'Concessionária' },
    ] as Awaited<ReturnType<typeof concessionairesService.getAll>>);
    vi.mocked(filesService.listByItem).mockResolvedValue([]);
  });

  it('lê os campos de acompanhamento persistidos pelo backend', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(backendService);

    const service = await servicosService.getById('service-1');

    expect(service).toEqual(
      expect.objectContaining({
        protocolo: 'SERV-2026-00001',
        status: 'abertura_servico',
        pontoReferencia: 'Próximo à praça',
        approvalStatus: 'pending',
        precisaAprovacao: true,
      }),
    );
    expect(service.timeline).toHaveLength(1);
  });

  it('nao busca enderecos na listagem leve', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([
      { ...backendService, construction_address_id: 'address-1' },
    ]);

    const services = await servicosService.list({ includeAddresses: false });

    expect(services).toHaveLength(1);
    expect(addressService.getById).not.toHaveBeenCalled();
  });

  it('persiste no backend o status e a nova entrada da linha do tempo', async () => {
    let persisted = { ...backendService };
    vi.mocked(apiClient.get).mockImplementation(async () => persisted);
    vi.mocked(apiClient.put).mockImplementation(async (_path, payload) => {
      persisted = { ...persisted, ...(payload as Partial<typeof backendService>) };
      return persisted;
    });

    const service = await servicosService.updateStatus('service-1', 'elaboracao_documentacao');

    expect(apiClient.put).toHaveBeenCalledWith(
      '/services/service-1',
      expect.objectContaining({
        protocol: 'SERV-2026-00001',
        status: 'elaboracao_documentacao',
        approval_status: 'pending',
        timeline: expect.any(String),
        timeline_comments: expect.any(String),
      }),
    );
    expect(service.status).toBe('elaboracao_documentacao');
    expect(service.timeline).toHaveLength(2);
  });
});
