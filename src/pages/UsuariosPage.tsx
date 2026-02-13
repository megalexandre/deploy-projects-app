import React, { useState } from 'react';
import { Users, Plus, MagnifyingGlass, PencilSimple, Trash, Shield, User, EnvelopeSimple } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
  departamento: string;
  status: 'ativo' | 'inativo';
  dataAdmissao: string;
  ultimoAcesso: string;
  permissoes: string[];
}

export const UsuariosPage: React.FC = () => {
  const [usuarios] = useState<Usuario[]>([
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@opjengenharia.com.br',
      telefone: '(11) 98765-4321',
      cargo: 'Engenheiro Sênior',
      departamento: 'Projetos',
      status: 'ativo',
      dataAdmissao: '2020-03-15',
      ultimoAcesso: '2024-01-19 14:30',
      permissoes: ['projetos', 'clientes', 'financeiro']
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria.santos@opjengenharia.com.br',
      telefone: '(11) 91234-5678',
      cargo: 'Técnica',
      departamento: 'Instalação',
      status: 'ativo',
      dataAdmissao: '2021-07-20',
      ultimoAcesso: '2024-01-19 09:15',
      permissoes: ['projetos', 'instalacao']
    },
    {
      id: '3',
      nome: 'Carlos Oliveira',
      email: 'carlos.oliveira@opjengenharia.com.br',
      telefone: '(11) 99876-5432',
      cargo: 'Financeiro',
      departamento: 'Administrativo',
      status: 'ativo',
      dataAdmissao: '2019-11-10',
      ultimoAcesso: '2024-01-18 16:45',
      permissoes: ['financeiro', 'relatorios']
    },
    {
      id: '4',
      nome: 'Ana Costa',
      email: 'ana.costa@opjengenharia.com.br',
      telefone: '(11) 97654-3210',
      cargo: 'Assistente Administrativo',
      departamento: 'Administrativo',
      status: 'inativo',
      dataAdmissao: '2022-02-01',
      ultimoAcesso: '2024-01-10 11:20',
      permissoes: ['projetos']
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('todos');

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesMagnifyingGlass = usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'todos' || usuario.departamento === selectedDepartment;
    return matchesMagnifyingGlass && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    return status === 'ativo' 
      ? 'bg-green-900/50 text-green-300 border-green-700' 
      : 'bg-red-900/50 text-red-300 border-red-700';
  };

  const departments = ['todos', ...Array.from(new Set(usuarios.map(u => u.departamento)))];

  const activeUsers = usuarios.filter(u => u.status === 'ativo').length;
  const inactiveUsers = usuarios.filter(u => u.status === 'inativo').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Usuários</h1>
          <p className="text-gray-400 mt-1">Gerenciamento de usuários e permissões</p>
        </div>
        <Button className="mt-4 sm:mt-0">
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-blue-400">{usuarios.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ativos</p>
                <p className="text-2xl font-bold text-green-400">{activeUsers}</p>
              </div>
              <User className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Inativos</p>
                <p className="text-2xl font-bold text-red-400">{inactiveUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Departamentos</p>
                <p className="text-2xl font-bold text-purple-400">
                  {Array.from(new Set(usuarios.map(u => u.departamento))).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlass />}
              />
            </div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              {departments.map(dept => (
                <option key={dept} value={dept}>
                  {dept === 'todos' ? 'Todos os Departamentos' : dept}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Cargo</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Departamento</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Último Acesso</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {usuario.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <div className="text-gray-100 font-medium">{usuario.nome}</div>
                          <div className="text-gray-400 text-sm">{usuario.telefone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center text-gray-100">
                        <EnvelopeSimple className="h-4 w-4 mr-2 text-gray-400" />
                        {usuario.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-100">{usuario.cargo}</td>
                    <td className="py-3 px-4 text-gray-100">{usuario.departamento}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(usuario.status)}`}>
                        {usuario.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-100">{usuario.ultimoAcesso}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <PencilSimple className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-400 hover:text-red-300">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
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


