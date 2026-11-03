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
    delete: vi.fn(),
    patch: vi.fn(),
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
    remove: vi.fn(),
    removeByItem: vi.fn(),
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
  service_type: 'Ligação Nova',
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
  coordinates: { latitude: -19.9, longitude: -43.9 },
  supply_voltage: '127/220V',
  pole_distance_over_30m: true,
  construction_address_id: 'address-1',
  generating_address_id: 'address-2',
  generating_consumer_unit: 'UC-123',
  approval_status: 'pending',
  document_category: '{}',
  reused_documents: '[]',
  apportionments: [
    {
      id: 'rateio-1',
      consumer_unit: 'UC-456',
      address: 'Rua da Beneficiária, 10',
      classification: 'Residencial',
      percentage: 100,
    },
  ],
  service_entry_items: [
    {
      id: 'item-1',
      connection_type: 'Monofásico',
      classification: 'Residencial',
      quantity: 1,
      circuit_breaker: '50A',
    },
  ],
  created_by: 'integrador-1',
  created_at: '2026-10-03T12:00:00.000Z',
  updated_at: '2026-10-03T12:00:00.000Z',
};

describe('servicosService', () => {
  it('salva somente identificador e subsequente e os recupera do backend', async () => {
    let persisted = { ...backendService, subsequence: 'A' as string | null };
    vi.mocked(apiClient.get).mockImplementation(async () => persisted);
    vi.mocked(apiClient.patch).mockImplementation(async (_url, payload) => {
      persisted = { ...persisted, ...(payload as typeof persisted) };
      return persisted;
    });
    const updated = await servicosService.updateIdentifier('service-1', '123', 'AB');
    expect(apiClient.patch).toHaveBeenCalledWith('/services/service-1', {
      protocol: '123',
      subsequence: 'AB',
    });
    expect(updated.protocolo).toBe('123');
    expect(updated.subsequencia).toBe('AB');
    await servicosService.updateIdentifier('service-1', '123', '');
    expect(persisted.subsequence).toBeNull();
    expect((await servicosService.getById('service-1')).subsequencia).toBeUndefined();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
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
    vi.mocked(addressService.getById).mockImplementation(async (id) => ({
      id,
      cep: '30100-000',
      place: id === 'address-1' ? 'Rua da Obra' : 'Rua da Geradora',
      address: id === 'address-1' ? 'Rua da Obra' : 'Rua da Geradora',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'Belo Horizonte',
      state: 'mg',
      link: '',
    }));
  });

  it('persiste a subsequência e permite removê-la sem alterar o protocolo', async () => {
    let persisted = { ...backendService, subsequence: 'A' as string | null };
    vi.mocked(apiClient.get).mockImplementation(async () => persisted);
    vi.mocked(apiClient.put).mockImplementation(async (_path, payload) => {
      persisted = { ...persisted, ...(payload as typeof persisted) };
      return persisted;
    });
    expect((await servicosService.getById('service-1')).subsequencia).toBe('A');
    expect((await servicosService.update('service-1', { subsequencia: ' B ' })).subsequencia).toBe(
      'B',
    );
    const cleared = await servicosService.update('service-1', { subsequencia: '' });
    expect(cleared.subsequencia).toBeUndefined();
    expect(cleared.protocolo).toBe(backendService.protocol);
    expect(persisted.subsequence).toBeNull();
  });

  it('desvincula documento reaproveitado sem excluir o arquivo original do cliente', async () => {
    let persisted = { ...backendService, reused_documents: '["customer-file"]' };
    const upload = { id: 'customer-file', fileName: 'CPF.pdf', urlS3: '', size: 10 };
    vi.mocked(apiClient.get).mockImplementation(async () => persisted);
    vi.mocked(filesService.listByItem).mockImplementation(async (id) =>
      id === 'customer-1' ? [upload] : [],
    );
    vi.mocked(apiClient.put).mockImplementation(async (_path, payload) => {
      persisted = { ...persisted, ...(payload as typeof persisted) };
      return persisted;
    });
    const updated = await servicosService.removeDocument('service-1', 'customer-file');
    expect(filesService.remove).not.toHaveBeenCalled();
    expect(updated.documentos).toEqual([]);
    expect(persisted.reused_documents).toBe('[]');
  });

  it('exclui um upload direto antes de atualizar os metadados do serviço', async () => {
    let files = [{ id: 'upload-1', fileName: 'Documento.pdf', urlS3: '', size: 10 }];
    vi.mocked(apiClient.get).mockResolvedValue(backendService);
    vi.mocked(filesService.listByItem).mockImplementation(async () => files);
    vi.mocked(filesService.remove).mockImplementation(async () => {
      files = [];
    });
    const updated = await servicosService.removeDocument('service-1', 'upload-1');
    expect(filesService.remove).toHaveBeenCalledWith('upload-1');
    expect(updated.documentos).toEqual([]);
  });

  it('preserva no frontend o integrador selecionado na criação do serviço', async () => {
    vi.mocked(apiClient.post).mockResolvedValue(backendService);
    vi.mocked(apiClient.get).mockResolvedValue(backendService);

    const service = await servicosService.create({
      tipo: 'ligacao_nova',
      clienteId: 'customer-1',
      cliente: 'Cliente',
      integradorId: 'integrador-1',
      integradorNome: 'Integrador Teste',
      concessionaria: 'Concessionária',
      dataAbertura: '2026-10-03',
      valor: 1_000,
    });

    expect(apiClient.post).toHaveBeenCalledWith(
      '/services',
      expect.objectContaining({
        integrator: 'integrador-1',
      }),
    );
    expect(service).toEqual(
      expect.objectContaining({
        integradorId: 'integrador-1',
        integradorNome: 'Integrador Teste',
      }),
    );
  });

  it('lê os campos de acompanhamento persistidos pelo backend', async () => {
    vi.mocked(apiClient.get).mockResolvedValue(backendService);

    const service = await servicosService.getById('service-1');

    expect(service).toEqual(
      expect.objectContaining({
        protocolo: 'SERV-2026-00001',
        tipo: 'ligacao_nova',
        nome: 'Ligação Nova',
        status: 'abertura_servico',
        pontoReferencia: 'Próximo à praça',
        approvalStatus: 'pending',
        precisaAprovacao: true,
        coordenadas: { latitude: '-19.9', longitude: '-43.9' },
        padraoMaisDe30m: 'sim',
        integradorId: 'integrador-1',
      }),
    );
    expect(service.timeline).toHaveLength(1);
    expect(service.enderecoObra?.logradouro).toBe('Rua da Obra');
    expect(service.enderecoGeradora?.logradouro).toBe('Rua da Geradora');
    expect(service.padraoEntradaItens).toEqual([
      expect.objectContaining({ id: 'item-1', disjuntor: '50A' }),
    ]);
    expect(service.rateios).toEqual([expect.objectContaining({ uc: 'UC-456', percentual: 100 })]);
  });

  it('nao busca enderecos na listagem leve', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      content: [{ ...backendService, construction_address_id: 'address-1' }],
      totalPages: 1,
    });

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
