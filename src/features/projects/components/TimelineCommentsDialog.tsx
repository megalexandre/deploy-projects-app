import React, { useState } from 'react';
import { ConfirmActionButton } from '@/shared/components/ConfirmActionButton';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import type { TimelineComment, TimelineItem } from '@/types';

type Props = {
  item: TimelineItem;
  mode: 'view' | 'add';
  commentText: string;
  saving: boolean;
  onCommentTextChange: (value: string) => void;
  onSave: () => void;
  onClose: () => void;
  onEdit?: (commentId: string, text: string) => Promise<unknown>;
  onRemove?: (commentId: string) => Promise<unknown>;
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR');
};

const CommentRow: React.FC<{
  comment: TimelineComment;
  onEdit?: Props['onEdit'];
  onRemove?: Props['onRemove'];
}> = ({ comment, onEdit, onRemove }) => {
  const user = useCurrentUser();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.texto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canManage = user?.isAdmin || (!!user?.id && comment.createdBy === user.id);
  const save = async () => {
    if (!text.trim() || !onEdit) return;
    setBusy(true);
    setError(null);
    try {
      await onEdit(comment.id, text.trim());
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível editar o comentário.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <strong className="text-sm text-slate-100">{comment.autor || 'Comentário interno'}</strong>
        <span className="text-xs text-slate-400">{formatDateTime(comment.data)}</span>
      </div>
      <p className="mt-2 text-sm text-slate-300">{comment.texto}</p>
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      {editing ? (
        <div className="mt-3 space-y-2">
          <textarea
            aria-label="Editar comentário"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={3}
            className="w-full rounded bg-slate-800 p-3 text-slate-100"
          />
          <Button
            type="button"
            size="sm"
            loading={busy}
            disabled={!text.trim()}
            onClick={() => void save()}
          >
            Salvar
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => setEditing(false)}
          >
            Cancelar
          </Button>
        </div>
      ) : (
        canManage && (
          <div className="mt-3 flex gap-2">
            {onEdit && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setText(comment.texto);
                  setEditing(true);
                }}
              >
                Editar
              </Button>
            )}
            {onRemove && (
              <ConfirmActionButton
                label="Excluir comentário"
                description="Excluir definitivamente este comentário?"
                onConfirm={() => onRemove(comment.id)}
              />
            )}
          </div>
        )
      )}
    </div>
  );
};

export const TimelineCommentsDialog: React.FC<Props> = ({
  item,
  mode,
  commentText,
  saving,
  onCommentTextChange,
  onSave,
  onClose,
  onEdit,
  onRemove,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <Card className="w-full max-w-2xl">
      <CardHeader className="mb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>
              {mode === 'add' ? 'Adicionar Comentário' : 'Comentários do Status'}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-400">{item.etapa}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        {(item.comentarios?.length ?? 0) === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-5 text-sm text-slate-400">
            Nenhum comentário registrado para este status.
          </div>
        ) : (
          <div className="space-y-3">
            {item.comentarios?.map((comment) => (
              <CommentRow key={comment.id} comment={comment} onEdit={onEdit} onRemove={onRemove} />
            ))}
          </div>
        )}

        {mode === 'add' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Novo comentário</label>
            <textarea
              value={commentText}
              onChange={(event) => onCommentTextChange(event.target.value)}
              rows={5}
              placeholder="Escreva um comentário para este status..."
              className="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/30"
            />
          </div>
        )}

        {mode === 'add' && (
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" loading={saving} onClick={onSave}>
              Salvar comentário
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
