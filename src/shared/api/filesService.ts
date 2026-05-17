import { ApiError, apiClient, resolveErrorMessage } from './apiClient';

export interface UploadedFileResponse {
  id: string;
  fileName: string;
  urlS3: string;
  size: number;
  createdAt?: string;
}

type BackendUploadResponse = {
  id?: string;
  filename?: string;
  url_s3?: string;
  size?: number;
  created_at?: string;
};

const FILES_ENDPOINT = '/uploads';

const normalizeUpload = (payload: BackendUploadResponse): UploadedFileResponse => ({
  id: payload.id ?? crypto.randomUUID(),
  fileName: payload.filename ?? 'Arquivo',
  urlS3: payload.url_s3 ?? '',
  size: typeof payload.size === 'number' ? payload.size : 0,
  createdAt: payload.created_at,
});

const buildUrl = (path: string) => {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = apiClient.baseUrl;
  // Em modo proxy (dev), baseUrl é relativo (/api). new URL exige base absoluta,
  // então usa a origem atual — o proxy do Vite intercepta o request.
  const absoluteBase = /^https?:\/\//i.test(baseUrl) ? `${baseUrl}/` : `${window.location.origin}/`;
  return new URL(endpoint, absoluteBase).toString();
};

const buildHeaders = () => {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  const token = apiClient.getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
};

export const filesService = {
  async uploadFiles(itemId: string, files: File[]): Promise<UploadedFileResponse[]> {
    if (files.length === 0) {
      return [];
    }

    // O backend vincula os arquivos ao item pelo campo multipart "item_id".
    const formData = new FormData();
    formData.append('item_id', itemId);
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(buildUrl(FILES_ENDPOINT), {
      method: 'POST',
      headers: buildHeaders(),
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        resolveErrorMessage(payload, 'Erro ao enviar arquivos'),
        response.status,
        payload,
      );
    }

    return Array.isArray(payload)
      ? payload.map((item) => normalizeUpload(item as BackendUploadResponse))
      : [];
  },

  async listByItem(itemId: string): Promise<UploadedFileResponse[]> {
    const response = await fetch(
      buildUrl(`${FILES_ENDPOINT}?item_id=${encodeURIComponent(itemId)}`),
      {
        method: 'GET',
        headers: buildHeaders(),
      },
    );

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(
        resolveErrorMessage(payload, 'Erro ao carregar arquivos'),
        response.status,
        payload,
      );
    }

    return Array.isArray(payload)
      ? payload.map((item) => normalizeUpload(item as BackendUploadResponse))
      : [];
  },

  async downloadFile(fileId: string) {
    const response = await fetch(buildUrl(`${FILES_ENDPOINT}/${fileId}/download`), {
      method: 'GET',
      headers: buildHeaders(),
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
