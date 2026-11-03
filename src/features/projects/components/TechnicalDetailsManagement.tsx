import { useEffect, useState } from 'react';
import {
  technicalDetailsService,
  type TechnicalDetailResponse,
} from '../services/technicalDetailsService';
import { ConfirmActionButton } from '@/shared/components/ConfirmActionButton';

export function TechnicalDetailsManagement({
  projectId,
  onChanged,
}: {
  projectId: string;
  onChanged: () => Promise<unknown>;
}) {
  const [details, setDetails] = useState<TechnicalDetailResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void technicalDetailsService
      .list(projectId)
      .then((data) => {
        if (active) setDetails(data);
      })
      .catch((cause: unknown) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : 'Não foi possível carregar os registros técnicos.',
          );
      });
    return () => {
      active = false;
    };
  }, [projectId]);
  return (
    <div className="space-y-3 text-sm">
      {error && (
        <p role="alert" className="text-red-300">
          {error}
        </p>
      )}
      {details.map((detail, index) => (
        <div
          key={detail.id}
          className="flex items-center justify-between gap-4 rounded border border-white/10 p-3"
        >
          <span className="text-slate-300">
            Registro técnico {index + 1} · {new Date(detail.created_at).toLocaleDateString('pt-BR')}
          </span>
          <ConfirmActionButton
            label="Excluir registro técnico"
            description="Excluir este registro técnico? O projeto será preservado. Se houver outro registro, seus dados passarão a ser exibidos."
            onConfirm={async () => {
              await technicalDetailsService.remove(projectId, detail.id);
              setDetails((items) => items.filter((item) => item.id !== detail.id));
              await onChanged();
            }}
          />
        </div>
      ))}
    </div>
  );
}
