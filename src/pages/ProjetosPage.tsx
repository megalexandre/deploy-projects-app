import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, MagnifyingGlass, Funnel, PlusCircle } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { projetoService } from '../services/projetoService';
import type { Projeto } from '../types';

export const ProjetosPage: React.FC = () => {
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [filteredProjetos, setFilteredProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProjetos();
  }, []);

  useEffect(() => {
    const filtered = projetos.filter(projeto =>
      projeto.protocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      projeto.dadosProjeto.concessionaria.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjetos(filtered);
  }, [searchTerm, projetos]);

  const loadProjetos = async () => {
    try {
      const data = await projetoService.getProjetos();
      setProjetos(data);
      setFilteredProjetos(data);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'text-green-400 bg-green-900/20';
      case 'em_andamento':
        return 'text-accent-500 bg-accent-900/20';
      case 'pendente':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'aprovado':
        return 'text-blue-400 bg-blue-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'concluido':
        return 'Concluído';
      case 'em_andamento':
        return 'Em Andamento';
      case 'pendente':
        return 'Pendente';
      case 'aprovado':
        return 'Aprovado';
      case 'instalacao':
        return 'Instalação';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Projetos</h1>
          <p className="text-gray-400 mt-1">
            Gestão de projetos fotovoltaicos
          </p>
        </div>
        <Link to="/projetos/novo">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Projeto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por protocolo, cliente ou concessionária..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<MagnifyingGlass />}
              />
            </div>
            <Button variant="outline">
              <Funnel className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredProjetos.length} projeto{filteredProjetos.length !== 1 ? 's' : ''} encontrado{filteredProjetos.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Concessionária
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Modalidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Potência
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredProjetos.map((projeto) => (
                  <tr key={projeto.id} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">
                      {projeto.protocolo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>
                        <div className="font-medium">{projeto.cliente.nome}</div>
                        <div className="text-gray-400">{projeto.cliente.cpfCnpj}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {projeto.dadosProjeto.concessionaria}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {projeto.dadosProjeto.modalidade === 'geracao_compartilhada' 
                        ? 'Geração Compartilhada' 
                        : 'Autoconsumo'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {projeto.dadosProjeto.potenciaSistema} kWp
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(projeto.status)}`}>
                        {getStatusText(projeto.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <Link to={`/projetos/${projeto.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Visualizar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredProjetos.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400">
                  Nenhum projeto encontrado para os filtros aplicados.
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


