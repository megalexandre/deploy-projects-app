/** Pagina 'FinanceiroPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyDollar,
  TrendUp,
  TrendDown,
  Plus,
  DownloadSimple,
  Calendar,
  PencilSimple,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card';
import { projectsService } from '@/services';
import { formatCurrencyBRL } from '@/core/utils/masks';

interface Transacao {
  id: string;
  descricao: string;
  tipo: 'receita' | 'despesa';
  valor: number;
  data: string;
  categoria: string;
  status: 'pago' | 'pendente';
}

type TransactionFormState = {
  descricao: string;
  categoria: string;
  tipo: Transacao['tipo'];
  status: Transacao['status'];
  valor: string;
  data: string;
};

const TRANSACTION_OVERRIDES_STORAGE_KEY = 'opj_finance_transaction_overrides';
const CUSTOM_TRANSACTIONS_STORAGE_KEY = 'opj_finance_custom_transactions';

const createEmptyTransactionForm = (): TransactionFormState => ({
  descricao: '',
  categoria: '',
  tipo: 'receita',
  status: 'pendente',
  valor: '',
  data: new Date().toISOString().split('T')[0],
});

const readStoredTransactions = (key: string): Transacao[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredTransactions = (key: string, items: Transacao[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(items));
};

export const FinanceiroPage: React.FC = () => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loadingProjetos, setLoadingProjetos] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [novaTransacao, setNovaTransacao] = useState<TransactionFormState>(
    createEmptyTransactionForm(),
  );

  useEffect(() => {
    const loadTransacoesFromProjetos = async () => {
      setLoadingProjetos(true);

      try {
        const projetos = await projectsService.getProjetos();
        const transacoesProjetos: Transacao[] = projetos
          .filter((projeto) => projeto.valor > 0)
          .map((projeto) => ({
            id: `projeto-${projeto.id}`,
            descricao: `Projeto ${projeto.protocolo} - ${projeto.cliente.nome}`,
            tipo: 'receita',
            valor: projeto.valor,
            data: (projeto.dataCriacao || new Date().toISOString()).split('T')[0],
            categoria: 'Projetos',
            status:
              projeto.status === 'concluido' || projeto.status === 'aprovado' ? 'pago' : 'pendente',
          }));

        const customTransactions = readStoredTransactions(CUSTOM_TRANSACTIONS_STORAGE_KEY);
        const transactionOverrides = readStoredTransactions(TRANSACTION_OVERRIDES_STORAGE_KEY);
        const overridesById = new Map(transactionOverrides.map((item) => [item.id, item]));
        const mergedProjectTransactions = transacoesProjetos.map(
          (transacao) => overridesById.get(transacao.id) ?? transacao,
        );

        setTransacoes([...customTransactions, ...mergedProjectTransactions]);
      } catch (error) {
        console.error('Erro ao carregar transacoes de projetos:', error);
      } finally {
        setLoadingProjetos(false);
      }
    };

    void loadTransacoesFromProjetos();
  }, []);

  const filteredTransacoes = transacoes.filter(
    (transacao) =>
      transacao.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transacao.categoria.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalReceitas = transacoes
    .filter((t) => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0);
  const totalDespesas = transacoes
    .filter((t) => t.tipo === 'despesa')
    .reduce((sum, t) => sum + t.valor, 0);
  const totalPendentes = transacoes
    .filter((t) => t.status === 'pendente')
    .reduce((sum, t) => sum + t.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const getTipoColor = (tipo: string) => {
    return tipo === 'receita' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusColor = (status: string) => {
    return status === 'pago'
      ? 'bg-green-900/50 text-green-300 border-green-700'
      : 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  };

  const resetForm = () => {
    setNovaTransacao(createEmptyTransactionForm());
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransactionId(null);
    resetForm();
  };

  const persistTransactions = (nextTransactions: Transacao[]) => {
    const customTransactions = nextTransactions.filter((item) => !item.id.startsWith('projeto-'));
    const transactionOverrides = nextTransactions.filter((item) => item.id.startsWith('projeto-'));
    writeStoredTransactions(CUSTOM_TRANSACTIONS_STORAGE_KEY, customTransactions);
    writeStoredTransactions(TRANSACTION_OVERRIDES_STORAGE_KEY, transactionOverrides);
  };

  const handleSubmitTransacao = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const valor = Number(novaTransacao.valor);
    if (
      !novaTransacao.descricao.trim() ||
      !novaTransacao.categoria.trim() ||
      !novaTransacao.data ||
      Number.isNaN(valor) ||
      valor <= 0
    ) {
      return;
    }

    const transactionId = editingTransactionId ?? String(Date.now());
    const updatedEntry: Transacao = {
      id: transactionId,
      descricao: novaTransacao.descricao.trim(),
      categoria: novaTransacao.categoria.trim(),
      tipo: novaTransacao.tipo,
      status: novaTransacao.status,
      valor,
      data: novaTransacao.data,
    };

    setTransacoes((prev) => {
      const nextTransactions = editingTransactionId
        ? prev.map((item) => (item.id === transactionId ? updatedEntry : item))
        : [updatedEntry, ...prev];
      persistTransactions(nextTransactions);
      return nextTransactions;
    });

    closeForm();
  };

  const handleEditTransacao = (transacao: Transacao) => {
    setEditingTransactionId(transacao.id);
    setNovaTransacao({
      descricao: transacao.descricao,
      categoria: transacao.categoria,
      tipo: transacao.tipo,
      status: transacao.status,
      valor: String(transacao.valor),
      data: transacao.data,
    });
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Financeiro</h1>
          <p className="text-gray-400 mt-1">Controle financeiro da OPJ Engenharia</p>
          {loadingProjetos && (
            <p className="text-xs text-gray-500 mt-1">Carregando dados de projetos...</p>
          )}
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline">
            <DownloadSimple className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button
            onClick={() => {
              if (isFormOpen && !editingTransactionId) {
                closeForm();
                return;
              }

              setEditingTransactionId(null);
              resetForm();
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Transacao
          </Button>
        </div>
      </div>

      {isFormOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>
                {editingTransactionId ? 'Editar transacao' : 'Cadastrar nova transacao'}
              </CardTitle>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-slate-800"
                aria-label="Fechar formulario de transacao"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmitTransacao}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                label="Descricao"
                placeholder="Ex: Entrada projeto comercial"
                value={novaTransacao.descricao}
                onChange={(e) =>
                  setNovaTransacao((prev) => ({ ...prev, descricao: e.target.value }))
                }
                required
              />
              <Input
                label="Categoria"
                placeholder="Ex: Projetos"
                value={novaTransacao.categoria}
                onChange={(e) =>
                  setNovaTransacao((prev) => ({ ...prev, categoria: e.target.value }))
                }
                required
              />
              <label className="block text-sm text-gray-300">
                <span className="mb-1 block">Tipo</span>
                <select
                  value={novaTransacao.tipo}
                  onChange={(e) =>
                    setNovaTransacao((prev) => ({
                      ...prev,
                      tipo: e.target.value as Transacao['tipo'],
                    }))
                  }
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
                  onChange={(e) =>
                    setNovaTransacao((prev) => ({
                      ...prev,
                      status: e.target.value as Transacao['status'],
                    }))
                  }
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
                <Button type="button" variant="outline" onClick={closeForm}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTransactionId ? 'Salvar alteracoes' : 'Salvar transacao'}
                </Button>
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
                <p
                  className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-400' : 'text-red-400'}`}
                >
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
              <Input
                placeholder="Buscar transacoes..."
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
                      {transacao.tipo === 'receita' ? '+' : '-'}{' '}
                      {formatCurrencyBRL(transacao.valor)}
                    </td>
                    <td className="py-3 px-4 text-gray-100">{formatDateBR(transacao.data)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(transacao.status)}`}
                      >
                        {transacao.status === 'pago' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransacao(transacao)}
                      >
                        <PencilSimple className="mr-1 h-4 w-4" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredTransacoes.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 px-4 text-center text-gray-400">
                      Nenhuma transacao de projeto encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
