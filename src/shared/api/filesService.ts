import { ApiError, apiClient, resolveErrorMessage } from './apiClient';
import { createKeyedRequestCache } from './requestCache';

export interface UploadedFileResponse {
  id: string;
  fileName: string;
  urlS3: string;
  size: number;
  createdAt?: string;
  createdBy?: string;
  itemId?: string;
}

type BackendUploadResponse = {
  id?: string;
  filename?: string;
  url_s3?: string;
  size?: number;
  created_at?: string;
  created_by?: string;
  item_id?: string;
};

const FILES_ENDPOINT = '/uploads';
const listCache = createKeyedRequestCache<UploadedFileResponse[]>(5_000);

const normalizeUpload = (payload: BackendUploadResponse): UploadedFileResponse => ({
  id: payload.id ?? crypto.randomUUID(),
  fileName: payload.filename ?? 'Arquivo',
  urlS3: payload.url_s3 ?? '',
  size: typeof payload.size === 'number' ? payload.size : 0,
  createdAt: payload.created_at,
  createdBy: payload.created_by,
  itemId: payload.item_id,
});

export const filesService = {
  async remove(id: string): Promise<void> {
    await apiClient.delete(`${FILES_ENDPOINT}/${id}`);
    listCache.invalidate();
  },

  async removeByItem(itemId: string) {
    const result = await apiClient.delete<{ deleted: number }>(
      `${FILES_ENDPOINT}/by_item/${itemId}`,
    );
    listCache.invalidate(itemId);
    return result;
  },
  async uploadFiles(itemId: string, files: File[]): Promise<UploadedFileResponse[]> {
    if (files.length === 0) {
      return [];
    }

    // O backend vincula os arquivos ao item pelo campo multipart "item_id".
    const formData = new FormData();
    formData.append('item_id', itemId);
    files.forEach((file) => formData.append('files[]', file));

    const payload = await apiClient.post<BackendUploadResponse[]>(FILES_ENDPOINT, formData);
    listCache.invalidate(itemId);

    return Array.isArray(payload)
      ? payload.map((item) => normalizeUpload(item as BackendUploadResponse))
      : [];
  },

  async listByItem(itemId: string): Promise<UploadedFileResponse[]> {
    return listCache.get(itemId, async () => {
      const payload = await apiClient.get<BackendUploadResponse[]>(FILES_ENDPOINT, {
        query: { item_id: itemId },
      });
      return Array.isArray(payload) ? payload.map(normalizeUpload) : [];
    });
  },

  async downloadFile(fileId: string) {
    const endpoint = `${FILES_ENDPOINT}/${fileId}/download`;
    const baseUrl = apiClient.baseUrl.replace(/\/+$/, '');
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        Accept: 'application/octet-stream',
        ...(apiClient.getToken() ? { Authorization: `Bearer ${apiClient.getToken()}` } : {}),
      },
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new ApiError(
        resolveErrorMessage(payload, 'Erro ao baixar arquivo'),
        response.status,
        payload,
      );
    }

    // O download e disparado por blob para respeitar autenticacao e preservar o nome vindo do backend.
    const blob = await response.blob();
    const contentDisposition = response.headers.get('content-disposition') ?? '';
    const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
    const fileName = fileNameMatch?.[1] ?? `arquivo-${fileId}`;
    const objectUrl = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = objectUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(objectUrl);
  },
};
