import { useEffect, useState } from 'react';
import type { Documento } from '@/types';
import { filesService, type UploadedFileResponse } from '@/shared/api/filesService';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { ConfirmActionButton } from './ConfirmActionButton';

export function DocumentRemoveButton({
  itemId,
  document,
  canUnlink = false,
  onRemove,
  onRemoved,
}: {
  itemId: string;
  document: Documento;
  canUnlink?: boolean;
  onRemove?: (fileId: string) => Promise<unknown>;
  onRemoved: () => Promise<unknown>;
}) {
  const user = useCurrentUser();
  const [uploads, setUploads] = useState<UploadedFileResponse[] | null>(null);
  useEffect(() => {
    let active = true;
    void filesService
      .listByItem(itemId)
      .then((items) => {
        if (active) setUploads(items);
      })
      .catch(() => {
        if (active) setUploads(null);
      });
    return () => {
      active = false;
    };
  }, [itemId, document.id]);
  if (!uploads) return null;
  const id = document.fileId || document.id;
  const direct = uploads.find((file) => file.id === id);
  const reused = !direct;
  if (reused ? !canUnlink : !(user?.isAdmin || (!!user?.id && direct.createdBy === user.id)))
    return null;
  return (
    <ConfirmActionButton
      label={reused ? 'Desvincular' : 'Excluir documento'}
      description={
        reused
          ? `Desvincular "${document.nome}" deste serviço? O arquivo do cliente será preservado.`
          : `Excluir definitivamente "${document.nome}"? O arquivo será removido do armazenamento.`
      }
      onConfirm={async () => {
        if (onRemove) await onRemove(id);
        else if (direct) await filesService.remove(id);
        await onRemoved();
      }}
    />
  );
}

export function RemoveAllDocumentsButton({
  itemId,
  onRemoved,
}: {
  itemId: string;
  onRemoved: () => Promise<unknown>;
}) {
  const user = useCurrentUser();
  if (!user?.isAdmin) return null;
  return (
    <ConfirmActionButton
      label="Excluir arquivos enviados"
      description="Excluir definitivamente todos os arquivos enviados diretamente para este cadastro? Documentos reaproveitados de outros cadastros serão preservados."
      onConfirm={async () => {
        await filesService.removeByItem(itemId);
        await onRemoved();
      }}
    />
  );
}
