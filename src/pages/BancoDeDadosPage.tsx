import React, { useState } from 'react';
import { Database, DownloadSimple, UploadSimple, ArrowsClockwise, MagnifyingGlass, Funnel, Trash, FileText, HardDrives, Pulse } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';

interface DatabaseTable {
  name: string;
  rows: number;
  size: string;
  lastModified: string;
  type: 'table' | 'view' | 'procedure';
}

interface Backup {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'automatic' | 'manual';
}

export const BancoDeDadosPage: React.FC = () => {
  const [tables] = useState<DatabaseTable[]>([
    {
      name: 'projetos',
      rows: 1247,
      size: '45.2 MB',
      lastModified: '2024-01-19 14:30',
      type: 'table'
    },
    {
      name: 'clientes',
      rows: 892,
      size: '12.8 MB',
      lastModified: '2024-01-19 13:15',
      type: 'table'
    },
    {
      name: 'servicos',
      rows: 534,
      size: '8.4 MB',
      lastModified: '2024-01-19 16:45',
      type: 'table'
    },
    {
      name: 'usuarios',
      rows: 45,
      size: '1.2 MB',
      lastModified: '2024-01-18 10:20',
      type: 'table'
    },
    {
      name: 'financeiro',
      rows: 2156,
      size: '67.3 MB',
      lastModified: '2024-01-19 17:00',
      type: 'table'
    }
  ]);

  const [backups] = useState<Backup[]>([
    {
      id: '1',
      name: 'backup_auto_20240119',
      size: '135.8 MB',
      date: '2024-01-19 02:00',
      type: 'automatic'
    },
    {
      id: '2',
      name: 'backup_manual_20240118',
      size: '134.9 MB',
      date: '2024-01-18 15:30',
      type: 'manual'
    },
    {
      id: '3',
      name: 'backup_auto_20240118',
      size: '134.5 MB',
      date: '2024-01-18 02:00',
      type: 'automatic'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'table':
        return 'bg-blue-900/50 text-blue-300 border-blue-700';
      case 'view':
        return 'bg-purple-900/50 text-purple-300 border-purple-700';
      case 'procedure':
        return 'bg-green-900/50 text-green-300 border-green-700';
      default:
        return 'bg-gray-900/50 text-gray-300 border-gray-700';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'table':
        return 'Tabela';
      case 'view':
        return 'View';
      case 'procedure':
        return 'Procedure';
      default:
        return type;
    }
  };

  const totalRows = tables.reduce((sum, table) => sum + table.rows, 0);
  const totalSize = tables.reduce((sum, table) => {
    const sizeInMB = parseFloat(table.size);
    return sum + sizeInMB;
  }, 0);

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Banco de Dados</h1>
          <p className="text-gray-400 mt-1">Gerencie o banco de dados da OPJ Engenharia</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" onClick={handleOptimize} disabled={isOptimizing}>
            <ArrowsClockwise className={`h-4 w-4 mr-2 ${isOptimizing ? 'animate-spin' : ''}`} />
            {isOptimizing ? 'Otimizando...' : 'Otimizar'}
          </Button>
          <Button>
            <UploadSimple className="h-4 w-4 mr-2" />
            Fazer Backup
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Tabelas</p>
                <p className="text-2xl font-bold text-blue-400">{tables.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total de Registros</p>
                <p className="text-2xl font-bold text-green-400">{totalRows.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Tamanho Total</p>
                <p className="text-2xl font-bold text-purple-400">{totalSize.toFixed(1)} MB</p>
              </div>
              <HardDrives className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Backups</p>
                <p className="text-2xl font-bold text-orange-400">{backups.length}</p>
              </div>
              <Pulse className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Status */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-100 mb-4">Status do Banco de Dados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <div className="text-sm font-medium text-gray-100">Conexão</div>
                <div className="text-xs text-gray-400">Ativa e estável</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-100">Performance</div>
                <div className="text-xs text-gray-400">Ótima</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-800 rounded-lg">
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
              <div>
                <div className="text-sm font-medium text-gray-100">Última Otimização</div>
                <div className="text-xs text-gray-400">Há 2 dias</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables */}
      <Card>
        <CardHeader>
          <CardTitle>Tabelas do Banco de Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Buscar tabelas..."
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Registros</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tamanho</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Última Modificação</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTables.map((table) => (
                  <tr 
                    key={table.name} 
                    className={`border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer ${
                      selectedTable === table.name ? 'bg-gray-800' : ''
                    }`}
                    onClick={() => setSelectedTable(table.name)}
                  >
                    <td className="py-3 px-4 text-gray-100 font-medium">{table.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(table.type)}`}>
                        {getTypeText(table.type)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-100">{table.rows.toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-100">{table.size}</td>
                    <td className="py-3 px-4 text-gray-100">{table.lastModified}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <DownloadSimple className="h-4 w-4" />
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

      {/* Backups */}
      <Card>
        <CardHeader>
          <CardTitle>Backups Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tamanho</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {backups.map((backup) => (
                  <tr key={backup.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100 font-medium">{backup.name}</td>
                    <td className="py-3 px-4 text-gray-100">{backup.size}</td>
                    <td className="py-3 px-4 text-gray-100">{backup.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        backup.type === 'automatic' 
                          ? 'bg-blue-900/50 text-blue-300 border-blue-700'
                          : 'bg-green-900/50 text-green-300 border-green-700'
                      }`}>
                        {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <DownloadSimple className="h-4 w-4" />
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


