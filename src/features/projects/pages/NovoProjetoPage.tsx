import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Card } from '@/shared/components/Card';
import { useNovoProjeto } from '@/features/projects/hooks/useNovoProjeto';
import { Passo1Cliente } from '@/features/projects/components/form/passo1/Passo1Cliente';
import { Passo2Basicos } from '@/features/projects/components/form/Passo2Basicos';
import { Passo3Detalhes } from '@/features/projects/components/form/Passo3Detalhes';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { useParams, useSearchParams } from 'react-router-dom';

const StepIndicator: React.FC<{ current: number; total: number }> = ({ current, total }) => (
  <div className="flex items-center gap-2 pt-1">
    {Array.from({ length: total }, (_, i) => i + 1).map((step) => (
      <div
        key={step}
        className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold ${
          current >= step ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
        }`}
      >
        {step}
      </div>
    ))}
  </div>
);

export const NovoProjetoPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const requestedStep = Number(searchParams.get('passo'));
  const initialStep = requestedStep >= 1 && requestedStep <= 3 ? (requestedStep as 1 | 2 | 3) : 1;
  const props = useNovoProjeto({ projectId: id, initialStep });
  const { navigate, passoAtual, erro, isEditing, editingProject, carregandoProjeto } = props;

  if (carregandoProjeto) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Card padding="none">
        <div className="border-b border-gray-700 px-6 py-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => navigate(isEditing && id ? `/projetos/${id}` : '/projetos')}
              className="mt-1 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Voltar para projetos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">
                {isEditing ? `Editar ${editingProject?.protocolo ?? 'Projeto'}` : 'Novo Projeto'}
              </h1>
              <p className="text-gray-400 text-xl">Passo {passoAtual} de 3</p>
            </div>
          </div>
          <StepIndicator current={passoAtual} total={3} />
        </div>

        <div className="p-6 space-y-8">
          {erro && (
            <div className="rounded-md border border-red-700 bg-red-900/20 px-4 py-3 text-red-300">
              {erro}
            </div>
          )}

          {passoAtual === 1 && <Passo1Cliente {...props} />}
          {passoAtual === 2 && <Passo2Basicos {...props} />}
          {passoAtual === 3 && <Passo3Detalhes {...props} />}
        </div>
      </Card>
    </div>
  );
};
