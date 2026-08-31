import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from './apiClient';
import { filesService } from './filesService';

vi.mock('./apiClient', () => ({
  ApiError: class ApiError extends Error {},
  resolveErrorMessage: vi.fn(),
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    getToken: vi.fn(),
    baseUrl: 'https://api.exemplo.com/api',
  },
}));

describe('filesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envia item_id e arquivos como multipart pelo cliente central da API', async () => {
    vi.mocked(apiClient.post).mockResolvedValue([
      {
        id: 'upload-1',
        filename: 'documento.pdf',
        url_s3: 'https://storage/documento.pdf',
        size: 3,
      },
    ]);
    const file = new File(['pdf'], 'documento.pdf', { type: 'application/pdf' });

    const result = await filesService.uploadFiles('project-1', [file]);

    expect(apiClient.post).toHaveBeenCalledOnce();
    const [endpoint, body] = vi.mocked(apiClient.post).mock.calls[0];
    expect(endpoint).toBe('/uploads');
    expect(body).toBeInstanceOf(FormData);
    expect((body as FormData).get('item_id')).toBe('project-1');
    expect((body as FormData).getAll('files[]')).toEqual([file]);
    expect(result[0]).toMatchObject({ id: 'upload-1', fileName: 'documento.pdf', size: 3 });
  });

  it('lista arquivos preservando o endpoint e enviando item_id como query', async () => {
    vi.mocked(apiClient.get).mockResolvedValue([]);

    await filesService.listByItem('project-1');

    expect(apiClient.get).toHaveBeenCalledWith('/uploads', {
      query: { item_id: 'project-1' },
    });
  });
});
