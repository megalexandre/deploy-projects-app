import { EyeIcon } from '@phosphor-icons/react';
import { getStatusColor, getStatusLabel } from '@/core/entities/projeto';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { useIdentifier } from '@/features/projects/hooks/useIdentifyer';
import type { Projeto } from '@/types';
import React from 'react';
import { Link } from 'react-router-dom';

const thCls = 'px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider';
const tdCls = 'px-6 py-4 whitespace-nowrap text-sm text-gray-300';

const formatProjectCategory = (tipoProjeto?: string) => {
  const normalized = (tipoProjeto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (
    ['fotovoltaico', 'projeto_fotovoltaico', 'solar', 'projeto_solar', 'energia_solar'].includes(
      normalized,
    )
  ) {
    return 'Projeto Solar';
  }

  if (['padrao_entrada', 'padrao de entrada', 'emuc', 'projeto_emuc'].includes(normalized)) {
    return 'Projeto EMUC';
  }

  if (['orcamento_conexao', 'orcamento de conexao'].includes(normalized)) {
    return 'Orcamento de Conexao';
  }

  return tipoProjeto || '-';
};

const ProjectRow: React.FC<{ project: Projeto }> = ({ project }) => {
  const currentUser = useCurrentUser();
  const admin = !!currentUser?.isAdmin;
  const identifier = useIdentifier({ project, isAdmin: admin });

  return (
    <tr key={project.id} className="hover:bg-gray-700/50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
        <div>{identifier}</div>
        {project.protocoloConcessionaria && (
          <div className="mt-1 text-xs font-normal text-cyan-200">
            Concessionária: {project.protocoloConcessionaria}
          </div>
        )}
      </td>
      <td className={tdCls}>{project.cliente.nome}</td>
      <td className={tdCls}>{project.dadosProjeto.concessionaria}</td>
      <td className={tdCls}>{formatProjectCategory(project.tipoProjeto)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <span className={`font-medium ${getStatusColor(project.status)}`}>
          {getStatusLabel(project.status)}
        </span>
      </td>
      <td className={tdCls}>
        <Link to={`/projetos/${project.id}`}>
          <Button variant="outline" size="sm">
            <EyeIcon className="h-4 w-4 mr-1" />
            Visualizar
          </Button>
        </Link>
      </td>
    </tr>
  );
};

export const RecentProjectsCard: React.FC<{ projects: Projeto[] }> = ({ projects }) => {
  const currentUser = useCurrentUser();
  const admin = !!currentUser?.isAdmin;

  return (
    <Card data-admin={admin}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Projetos Recentes</CardTitle>
          <Link to="/projetos">
            <Button variant="outline" size="sm">
              Ver Todos
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className={thCls}>{admin ? 'Identificador' : 'Protocolo'}</th>
                <th className={thCls}>Cliente</th>
                <th className={thCls}>Concessionária</th>
                <th className={thCls}>Categoria</th>
                <th className={thCls}>Status</th>
                <th className={thCls}>Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {projects.map((project) => (
                <ProjectRow key={project.id} project={project} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
