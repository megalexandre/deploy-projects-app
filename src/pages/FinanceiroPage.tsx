import React, { useState } from 'react';
import { CurrencyDollar, TrendUp, TrendDown, Plus, DownloadSimple, Calendar } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { formatCurrencyBRL } from '../utils/masks';

interface Transacao {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  data: string;
  categoria: string;
  status: 'pago' | 'pendente';
}

export const FinanceiroPage: React.FC = () => {
  const [transacoes] = useState<Transacao[]>([
    {
      id: '1',
      descricao: 'Pagamento Projeto Solar',
      tipo: 'receita',
      valor: 15000.00,
      data: '2024-01-15',
      categoria: 'Projetos',
      status: 'pago'
    },
    {
      id: '2',
      descricao: 'Compra de Painéis',
      tipo: 'despesa',
      valor: 8000.00,
      data: '2024-01-10',
      categoria: 'Materiais',
      status: 'pago'
    },
    {
      id: '3',
      descricao: 'Manutenção Sistema',
      tipo: 'receita',
      valor: 500.00,
      data: '2024-01-20',
      categoria: 'Serviços',
      status: 'pendente'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('mes');

  const filteredTransacoes = transacoes.filter(transacao =>
    transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceitas = transacoes.filter(t => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoes.filter(t => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
  const totalPendentes = transacoes.filter(t => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const formatDateBR = (date: string) =>
    new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const getTipoColor = (tipo: string) => {
    return tipo === 'receita' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    return status === 'pago' ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Financeiro</h1>
          <p className="text-gray-400 mt-1">Controle financeiro da OPJ Engenharia</p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline">
            <DownloadSimple className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Receitas</p>
                <p className="text-2xl font-bold text-green-400">
                  {formatCurrencyBRL(totalReceitas)}
                </p>
              </div>
              <TrendUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Despesas</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrencyBRL(totalDespesas)}
                </p>
              </div>
              <TrendDown className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatCurrencyBRL(saldo)}
                </p>
              </div>
              <CurrencyDollar className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {formatCurrencyBRL(totalPendentes)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
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
                placeholder="Buscar transações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="dia">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mês</option>
              <option value="ano">Este Ano</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Descrição</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransacoes.map((transacao) => (
                  <tr key={transacao.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100">{transacao.descricao}</td>
                    <td className="py-3 px-4 text-gray-100">{transacao.categoria}</td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${getTipoColor(transacao.tipo)}`}>
                        {transacao.tipo === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className={`py-3 px-4 font-medium ${getTipoColor(transacao.tipo)}`}>
                      {transacao.tipo === 'receita' ? '+' : '-'} {formatCurrencyBRL(transacao.valor)}
                    </td>
                    <td className="py-3 px-4 text-gray-100">{formatDateBR(transacao.data)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transacao.status)}`}>
                        {transacao.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button variant="outline" size="sm">
                        Editar
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

