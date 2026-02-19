import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [transacoes, setTransacoes] = useState<Transacao[]>([
    {
      id: '1',
      descricao: 'Pagamento Projeto Solar',
      tipo: 'receita',
      valor: 15000.0,
      data: '2024-01-15',
      categoria: 'Projetos',
      status: 'pago'
    },
    {
      id: '2',
      descricao: 'Compra de Paineis',
      tipo: 'despesa',
      valor: 8000.0,
      data: '2024-01-10',
      categoria: 'Materiais',
      status: 'pago'
    },
    {
      id: '3',
      descricao: 'Manutencao Sistema',
      tipo: 'receita',
      valor: 500.0,
      data: '2024-01-20',
      categoria: 'Servicos',
      status: 'pendente'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [novaTransacao, setNovaTransacao] = useState({
    descricao: '',
    categoria: '',
    tipo: 'receita' as Transacao['tipo'],
    status: 'pendente' as Transacao['status'],
    valor: '',
    data: new Date().toISOString().split('T')[0]
  });

  const filteredTransacoes = transacoes.filter((transacao) =>
    transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceitas = transacoes.filter((t) => t.tipo === 'receita').reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoes.filter((t) => t.tipo === 'despesa').reduce((sum, t) => sum + t.valor, 0);
  const totalPendentes = transacoes.filter((t) => t.status === 'pendente').reduce((sum, t) => sum + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const getTipoColor = (tipo: string) => {
    return tipo === 'receita' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    return status === 'pago' ? 'bg-green-900/50 text-green-300 border-green-700' : 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  };

  const resetForm = () => {
    setNovaTransacao({
      descricao: '',
      categoria: '',
      tipo: 'receita',
      status: 'pendente',
      valor: '',
      data: new Date().toISOString().split('T')[0]
    });
  };

  const handleCreateTransacao = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const valor = Number(novaTransacao.valor);
    if (!novaTransacao.descricao.trim() || !novaTransacao.categoria.trim() || !novaTransacao.data || Number.isNaN(valor) || valor <= 0) {
      return;
    }

    const novaEntrada: Transacao = {
      id: String(Date.now()),
      descricao: novaTransacao.descricao.trim(),
      categoria: novaTransacao.categoria.trim(),
      tipo: novaTransacao.tipo,
      status: novaTransacao.status,
      valor,
      data: novaTransacao.data
    };

    setTransacoes((prev) => [novaEntrada, ...prev]);
    resetForm();
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
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
          <Button onClick={() => setIsFormOpen((prev) => !prev)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Transacao
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>Cadastrar nova transacao</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTransacao} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Descricao"
                placeholder="Ex: Entrada projeto comercial"
                value={novaTransacao.descricao}
                onChange={(e) => setNovaTransacao((prev) => ({ ...prev, descricao: e.target.value }))}
                required
              />
              <Input
                label="Categoria"
                placeholder="Ex: Projetos"
                value={novaTransacao.categoria}
                onChange={(e) => setNovaTransacao((prev) => ({ ...prev, categoria: e.target.value }))}
                required
              />
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block">Tipo</span>
                <select
                  value={novaTransacao.tipo}
                  onChange={(e) => setNovaTransacao((prev) => ({ ...prev, tipo: e.target.value as Transacao['tipo'] }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="receita">Receita</option>
                  <option value="despesa">Despesa</option>
                </select>
              </label>
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block">Status</span>
                <select
                  value={novaTransacao.status}
                  onChange={(e) => setNovaTransacao((prev) => ({ ...prev, status: e.target.value as Transacao['status'] }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </label>
              <Input
                label="Valor"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={novaTransacao.valor}
                onChange={(e) => setNovaTransacao((prev) => ({ ...prev, valor: e.target.value }))}
                required
              />
              <Input
                label="Data"
                type="date"
                value={novaTransacao.data}
                onChange={(e) => setNovaTransacao((prev) => ({ ...prev, data: e.target.value }))}
                required
              />
              <div className="md:col-span-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar transacao</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Receitas</p>
                <p className="text-2xl font-bold text-green-400">{formatCurrencyBRL(totalReceitas)}</p>
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
                <p className="text-2xl font-bold text-red-400">{formatCurrencyBRL(totalDespesas)}</p>
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
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrencyBRL(saldo)}</p>
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
                <p className="text-2xl font-bold text-yellow-400">{formatCurrencyBRL(totalPendentes)}</p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Modulos financeiros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link to="/financeiro/pagamentos">
            <Button variant="outline">Pagamentos</Button>
          </Link>
          <Link to="/financeiro/recebimentos">
            <Button variant="outline">Recebimentos</Button>
          </Link>
          <Link to="/financeiro/faturas">
            <Button variant="outline">Faturas</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input placeholder="Buscar transacoes..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              <option value="dia">Hoje</option>
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="ano">Este Ano</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transacoes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Descricao</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Categoria</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Tipo</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Acoes</th>
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
