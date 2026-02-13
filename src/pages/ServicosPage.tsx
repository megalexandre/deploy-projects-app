import React, { useState } from 'react';
import { Wrench, Plus, MagnifyingGlass, Funnel } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

interface Servico {
  id: string;
  nome: string;
  cliente: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  data: string;
  valor: number;
}

export const ServicosPage: React.FC = () => {
  const [servicos] = useState<Servico[]>([
    {
      id: '1',
      nome: 'Manutenção Preventiva',
      cliente: 'João Silva',
      status: 'pendente',
      data: '2024-01-15',
      valor: 500.00
    },
    {
      id: '2',
      nome: 'Instalação de Painéis',
      cliente: 'Maria Santos',
      status: 'em_andamento',
      data: '2024-01-20',
      valor: 2500.00
    },
    {
      id: '3',
      nome: 'Vistoria Técnica',
      cliente: 'Carlos Oliveira',
      status: 'concluido',
      data: '2024-01-10',
      valor: 300.00
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const filteredServicos = servicos.filter(servico =>
    servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    servico.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      case 'em_andamento':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'concluido':
        return 'bg-green-900/50 text-green-300 border-green-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Serviços</h1>
          <p className="text-gray-400 mt-1">Gerencie todos os serviços da OPJ Engenharia</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Serviço
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {servicos.filter(s => s.status === 'pendente').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Em Andamento</p>
                <p className="text-2xl font-bold text-blue-400">
                  {servicos.filter(s => s.status === 'em_andamento').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Concluídos</p>
                <p className="text-2xl font-bold text-green-400">
                  {servicos.filter(s => s.status === 'concluido').length}
                </p>
              </div>
              <Wrench className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MagnifyingGlass and Funnel */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlass />}
              />
            </div>
            <Button variant="outline">
              <Funnel className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredServicos.map((servico) => (
                  <tr key={servico.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100">{servico.nome}</td>
                    <td className="py-3 px-4 text-gray-100">{servico.cliente}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(servico.status)}`}>
                        {getStatusText(servico.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-100">{servico.data}</td>
                    <td className="py-3 px-4 text-gray-100">R$ {servico.valor.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


