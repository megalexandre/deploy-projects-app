import { ApiError, apiClient } from './apiClient';

export interface UploadedFileResponse {
  id: string;
  fileName: string;
  urlS3: string;
  size: number;
  createdAt?: string;
}

const FILES_ENDPOINT = '/api/v1/file';

const buildUrl = (path: string) => {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = apiClient.baseUrl;
  return new URL(endpoint, `${baseUrl}/`).toString();
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

const resolveErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
};

export const filesService = {
  async uploadFiles(itemId: string, files: File[]): Promise<UploadedFileResponse[]> {
    if (files.length === 0) {
      return [];
    }

    // O backend vincula os arquivos ao item pelo campo multipart "id".
    const formData = new FormData();
    formData.append('id', itemId);
    files.forEach((file) => formData.append('files', file));

    const response = await fetch(buildUrl(`${FILES_ENDPOINT}/upload`), {
      method: 'POST',
      headers: buildHeaders(),
      body: formData
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const payload = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      throw new ApiError(resolveErrorMessage(payload, 'Erro ao enviar arquivos'), response.status, payload);
    }

    return Array.isArray(payload) ? (payload as UploadedFileResponse[]) : [];
  },

  async downloadFile(fileId: string) {
    const response = await fetch(buildUrl(`${FILES_ENDPOINT}/download/${fileId}`), {
      method: 'GET',
      headers: buildHeaders()
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new ApiError(resolveErrorMessage(payload, 'Erro ao baixar arquivo'), response.status, payload);
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
  }
};
