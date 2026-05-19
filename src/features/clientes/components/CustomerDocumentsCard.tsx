import React from 'react';
import { DownloadSimple, FileText, UploadSimple } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import type { Customer } from '@/services';

type Props = {
  customer: Customer;
  uploadingDocuments: boolean;
  onUploadDocuments: (files: FileList | null) => void;
  onDownload: (fileId?: string) => void;
  onClose: () => void;
};

export const CustomerDocumentsCard: React.FC<Props> = ({
  customer,
  uploadingDocuments,
  onUploadDocuments,
  onDownload,
  onClose,
}) => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between gap-4">
        <div>
          <CardTitle>Documentos do Cliente</CardTitle>
          <p className="mt-1 text-sm text-slate-400">{customer.nome}</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/50">
            <UploadSimple className="mr-2 h-4 w-4" />
            {uploadingDocuments ? 'Enviando...' : 'Adicionar documentos'}
            <input
              type="file"
              className="hidden"
              multiple
              disabled={uploadingDocuments}
              onChange={(event) => {
                onUploadDocuments(event.target.files);
                event.target.value = '';
              }}
            />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-6">
      {customer.documentos.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhum documento cadastrado para este cliente.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-slate-950/50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3 text-right">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {customer.documentos.map((documento) => (
                <tr key={documento.id} className="text-sm text-slate-200">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      {documento.nome}
                    </div>
                  </td>
                  <td className="px-4 py-3">{documento.tipo}</td>
                  <td className="px-4 py-3">
                    {new Date(documento.dataUpload).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void onDownload(documento.fileId)}
                      disabled={!documento.fileId}
                    >
                      <DownloadSimple className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
);
