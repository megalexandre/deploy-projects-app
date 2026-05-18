import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';

export const ProjetosPageHeader: React.FC = () => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold text-gray-100">Projetos</h1>
      <p className="mt-1 text-gray-400">Kanban com 12 status aceitos para projetos.</p>
    </div>
    <Link to="/projetos/novo">
      <Button>
        <PlusCircle className="mr-2 h-4 w-4" />
        Novo Projeto
      </Button>
    </Link>
  </div>
);
