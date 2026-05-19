import React from 'react';
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
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR');
};

const CommentRow: React.FC<{ comment: TimelineComment }> = ({ comment }) => (
  <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
    <div className="flex items-center justify-between gap-3">
      <strong className="text-sm text-slate-100">{comment.autor || 'Comentario interno'}</strong>
      <span className="text-xs text-slate-400">{formatDateTime(comment.data)}</span>
    </div>
    <p className="mt-2 text-sm text-slate-300">{comment.texto}</p>
  </div>
);

export const TimelineCommentsDialog: React.FC<Props> = ({
  item,
  mode,
  commentText,
  saving,
  onCommentTextChange,
  onSave,
  onClose,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
    <Card className="w-full max-w-2xl">
      <CardHeader className="mb-0">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>
              {mode === 'add' ? 'Adicionar Comentario' : 'Comentarios do Status'}
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
            Nenhum comentario registrado para este status.
          </div>
        ) : (
          <div className="space-y-3">
            {item.comentarios?.map((comment) => (
              <CommentRow key={comment.id} comment={comment} />
            ))}
          </div>
        )}

        {mode === 'add' && (
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Novo comentario</label>
            <textarea
              value={commentText}
              onChange={(event) => onCommentTextChange(event.target.value)}
              rows={5}
              placeholder="Escreva um comentario para este status..."
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
              Salvar comentario
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
