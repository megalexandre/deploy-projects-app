/** Pagina 'FinanceiroPage': dashboard financeiro baseado nos lancamentos da API. */
import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CalendarBlank,
  CaretLeft,
  CaretRight,
  ChartLineUp,
  MagnifyingGlass,
  PencilSimple,
  PlusCircle,
  ShieldCheck,
  Wallet,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { formatCurrencyBRL, maskCurrencyBRL, parseCurrencyBRL } from '@/core/utils/masks';
import { projectsService } from '@/features/projects/services/projectsService';
import { servicosService } from '@/features/servicos/services/servicosService';
import type { Projeto, Servico } from '@/types';
import {
  financeiroService,
  type LedgerKind,
  type TransacaoFinanceira,
} from '../services/financeiroService';

type TransactionFormState = {
  descricao: string;
  tipo: LedgerKind;
  valor: string;
};

type FinanceTab = 'geral' | 'projetos' | 'servicos';
type PeriodFilter = 'todos' | '30' | 'mes' | 'personalizado';
type TypeFilter = 'todos' | LedgerKind;

type ForecastReceivable = {
  id: string;
  origem: 'projeto' | 'servico';
  descricao: string;
  valor: number;
  data: string;
  status: 'previsto';
};

type FinanceRow =
  | { kind: 'transacao'; transacao: TransacaoFinanceira }
  | { kind: 'previsao'; previsao: ForecastReceivable };

const createEmptyTransactionForm = (): TransactionFormState => ({
  descricao: '',
  tipo: 'receita',
  valor: '',
});

const glassCardClass =
  'rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.95)] backdrop-blur-xl';

const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
const ROWS_PER_PAGE = 8;

const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');
const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const getTransactionMonth = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? 0 : Math.min(parsed.getMonth(), 5);
};

const isInsidePeriod = (date: string, period: PeriodFilter, customFrom = '', customTo = '') => {
  if (period === 'todos') return true;

  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;

  const today = new Date();

  if (period === 'personalizado') {
    const from = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
    const to = customTo ? new Date(`${customTo}T23:59:59`) : null;
    if (from && parsed < from) return false;
    if (to && parsed > to) return false;
    return true;
  }

  if (period === 'mes') {
    return parsed.getFullYear() === today.getFullYear() && parsed.getMonth() === today.getMonth();
  }

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  return parsed >= thirtyDaysAgo;
};

export const FinanceiroPage: React.FC = () => {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('todos');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [activeTab, setActiveTab] = useState<FinanceTab>('geral');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [novaTransacao, setNovaTransacao] = useState<TransactionFormState>(
    createEmptyTransactionForm(),
  );

  const loadFinanceData = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextTransacoes, nextProjetos, nextServicos] = await Promise.all([
        financeiroService.listTransacoes(),
        projectsService.getAll().catch(() => []),
        servicosService.list().catch(() => []),
      ]);

      setTransacoes(nextTransacoes);
      setProjetos(nextProjetos);
      setServicos(nextServicos);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setErrorMessage('Nao foi possivel carregar os dados financeiros.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFinanceData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, customFrom, customTo, searchTerm, selectedPeriod, typeFilter]);

  const scopedTransacoes = useMemo(
    () =>
      transacoes.filter((transacao) => {
        if (activeTab === 'projetos') return Boolean(transacao.projectId);
        if (activeTab === 'servicos') return Boolean(transacao.serviceId);
        return true;
      }),
    [activeTab, transacoes],
  );

  const forecastReceivables = useMemo<ForecastReceivable[]>(() => {
    const paidByProjectId = new Map<string, number>();
    const paidByServiceId = new Map<string, number>();

    transacoes
      .filter((transacao) => transacao.tipo === 'receita')
      .forEach((transacao) => {
        if (transacao.projectId) {
          paidByProjectId.set(
            transacao.projectId,
            (paidByProjectId.get(transacao.projectId) ?? 0) + transacao.valor,
          );
        }

        if (transacao.serviceId) {
          paidByServiceId.set(
            transacao.serviceId,
            (paidByServiceId.get(transacao.serviceId) ?? 0) + transacao.valor,
          );
        }
      });

    const projectForecasts =
      activeTab === 'servicos'
        ? []
        : projetos
            .map((projeto) => {
              const total = Number(projeto.valor) || 0;
              const paid = paidByProjectId.get(projeto.id) ?? 0;
              return { projeto, remaining: Math.max(total - paid, 0) };
            })
            .filter((item) => item.remaining > 0)
            .map((projeto) => ({
              id: `projeto:${projeto.projeto.id}`,
              origem: 'projeto' as const,
              descricao: `Previsao pendente do projeto ${projeto.projeto.protocolo}`,
              valor: projeto.remaining,
              data: projeto.projeto.dataAbertura || projeto.projeto.dataCriacao.slice(0, 10),
              status: 'previsto' as const,
            }));

    const serviceForecasts =
      activeTab === 'projetos'
        ? []
        : servicos
            .map((servico) => {
              const total = Number(servico.valorFinal) || 0;
              const paid = paidByServiceId.get(servico.id) ?? 0;
              return { servico, remaining: Math.max(total - paid, 0) };
            })
            .filter((item) => item.remaining > 0)
            .map((servico) => ({
              id: `servico:${servico.servico.id}`,
              origem: 'servico' as const,
              descricao: `Previsao pendente do servico ${servico.servico.protocolo}`,
              valor: servico.remaining,
              data: servico.servico.dataAbertura || servico.servico.dataCriacao.slice(0, 10),
              status: 'previsto' as const,
            }));

    return [...projectForecasts, ...serviceForecasts];
  }, [activeTab, projetos, servicos, transacoes]);

  const periodTransacoes = useMemo(
    () =>
      scopedTransacoes.filter((transacao) =>
        isInsidePeriod(transacao.data, selectedPeriod, customFrom, customTo),
      ),
    [customFrom, customTo, scopedTransacoes, selectedPeriod],
  );

  const periodForecasts = useMemo(
    () =>
      forecastReceivables.filter((previsao) =>
        isInsidePeriod(previsao.data, selectedPeriod, customFrom, customTo),
      ),
    [customFrom, customTo, forecastReceivables, selectedPeriod],
  );

  const filteredTransacoes = useMemo(
    () =>
      periodTransacoes.filter((transacao) => {
        if (typeFilter !== 'todos' && transacao.tipo !== typeFilter) return false;

        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;

        return (
          transacao.descricao.toLowerCase().includes(query) ||
          transacao.categoria.toLowerCase().includes(query)
        );
      }),
    [periodTransacoes, searchTerm, typeFilter],
  );

  const filteredForecasts = useMemo(
    () =>
      periodForecasts.filter((previsao) => {
        if (typeFilter === 'despesa') return false;

        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;

        return previsao.descricao.toLowerCase().includes(query);
      }),
    [periodForecasts, searchTerm, typeFilter],
  );

  const totals = useMemo(() => {
    const totalReceitas = filteredTransacoes
      .filter((item) => item.tipo === 'receita')
      .reduce((sum, item) => sum + item.valor, 0);
    const totalDespesas = filteredTransacoes
      .filter((item) => item.tipo === 'despesa')
      .reduce((sum, item) => sum + item.valor, 0);
    const totalPrevisto = filteredForecasts.reduce((sum, item) => sum + item.valor, 0);

    return {
      totalReceitas,
      totalDespesas,
      totalPrevisto,
      saldo: totalReceitas - totalDespesas,
      saldoProjetado: totalReceitas + totalPrevisto - totalDespesas,
    };
  }, [filteredForecasts, filteredTransacoes]);

  const chartData = useMemo(() => {
    const initial = monthLabels.map((label) => ({ label, receitas: 0, previsto: 0, despesas: 0 }));

    filteredTransacoes.forEach((item) => {
      const month = getTransactionMonth(item.data);
      if (item.tipo === 'receita') {
        initial[month].receitas += item.valor;
      } else {
        initial[month].despesas += item.valor;
      }
    });

    filteredForecasts.forEach((item) => {
      const month = getTransactionMonth(item.data);
      initial[month].previsto += item.valor;
    });

    const maxValue = Math.max(
      ...initial.flatMap((item) => [item.receitas, item.previsto, item.despesas]),
      1,
    );

    return initial.map((item) => ({
      ...item,
      receitaHeight: Math.max((item.receitas / maxValue) * 100, item.receitas > 0 ? 12 : 4),
      previstoHeight: Math.max((item.previsto / maxValue) * 100, item.previsto > 0 ? 12 : 4),
      despesaHeight: Math.max((item.despesas / maxValue) * 100, item.despesas > 0 ? 12 : 4),
      saldo: item.receitas + item.previsto - item.despesas,
    }));
  }, [filteredForecasts, filteredTransacoes]);

  const saldoPath = useMemo(() => {
    const maxSaldo = Math.max(...chartData.map((item) => Math.abs(item.saldo)), 1);
    const points = chartData.map((item, index) => {
      const x = index * 80;
      const y = 100 - (item.saldo / maxSaldo) * 70;
      return `${index === 0 ? 'M' : 'L'} ${x} ${Math.max(20, Math.min(180, y))}`;
    });

    return points.join(' ');
  }, [chartData]);

  const barChartMaxValue = useMemo(
    () =>
      Math.max(...chartData.flatMap((item) => [item.receitas, item.previsto, item.despesas]), 1),
    [chartData],
  );

  const barChartTicks = useMemo(
    () => [barChartMaxValue, barChartMaxValue * 0.66, barChartMaxValue * 0.33, 0],
    [barChartMaxValue],
  );

  const lineChartMaxValue = useMemo(
    () => Math.max(...chartData.map((item) => Math.abs(item.saldo)), 1),
    [chartData],
  );

  const lineChartTicks = useMemo(
    () => [
      lineChartMaxValue,
      lineChartMaxValue * 0.33,
      -lineChartMaxValue * 0.33,
      -lineChartMaxValue,
    ],
    [lineChartMaxValue],
  );

  const resetForm = () => {
    setNovaTransacao(createEmptyTransactionForm());
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransactionId(null);
    resetForm();
  };

  const openCreateForm = () => {
    if (isFormOpen && !editingTransactionId) {
      closeForm();
      return;
    }

    setEditingTransactionId(null);
    resetForm();
    setIsFormOpen(true);
  };

  const handleSubmitTransacao = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const valor = parseCurrencyBRL(novaTransacao.valor);
    if (!novaTransacao.descricao.trim() || Number.isNaN(valor) || valor <= 0) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        amount: valor,
        reason: novaTransacao.tipo,
        description: novaTransacao.descricao.trim(),
      };

      if (editingTransactionId) {
        await financeiroService.updateLedger(editingTransactionId, payload);
      } else {
        await financeiroService.createLedger(payload);
      }

      closeForm();
      await loadFinanceData();
    } catch (error) {
      console.error('Erro ao salvar lancamento financeiro:', error);
      setErrorMessage('Nao foi possivel salvar o lancamento financeiro.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTransacao = (transacao: TransacaoFinanceira) => {
    setEditingTransactionId(transacao.id);
    setNovaTransacao({
      descricao: transacao.descricao,
      tipo: transacao.tipo,
      valor: formatCurrencyBRL(transacao.valor),
    });
    setIsFormOpen(true);
  };

  const tabs: Array<{ id: FinanceTab; label: string }> = [
    { id: 'geral', label: 'Geral' },
    { id: 'projetos', label: 'Projetos' },
    { id: 'servicos', label: 'Servicos' },
  ];

  const financeRows = useMemo<FinanceRow[]>(
    () =>
      [
        ...filteredTransacoes.map((transacao) => ({
          kind: 'transacao' as const,
          transacao,
        })),
        ...filteredForecasts.map((previsao) => ({
          kind: 'previsao' as const,
          previsao,
        })),
      ].sort((left, right) => {
        const leftDate = left.kind === 'transacao' ? left.transacao.data : left.previsao.data;
        const rightDate = right.kind === 'transacao' ? right.transacao.data : right.previsao.data;
        return rightDate.localeCompare(leftDate);
      }),
    [filteredForecasts, filteredTransacoes],
  );

  const totalPages = Math.max(Math.ceil(financeRows.length / ROWS_PER_PAGE), 1);
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStart = (safeCurrentPage - 1) * ROWS_PER_PAGE;
  const recentRows = financeRows.slice(pageStart, pageStart + ROWS_PER_PAGE);

  return (
    <div className="page-enter space-y-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-200">Financeiro</h1>
          <p className="mt-1 text-sm text-slate-400">Controle de caixa da OPJ Engenharia</p>
          {loading && <p className="mt-2 text-xs text-slate-500">Sincronizando com a API...</p>}
          {errorMessage && <p className="mt-2 text-xs text-red-300">{errorMessage}</p>}
        </div>

        <Button type="button" onClick={openCreateForm}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Lancamento
        </Button>
      </header>

      <nav className="flex flex-col gap-4 border-b border-white/10 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-2 sm:gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'border-b-2 px-2 py-4 text-base font-semibold transition',
                activeTab === tab.id
                  ? 'border-cyan-300 text-cyan-200'
                  : 'border-transparent text-slate-400 hover:text-slate-100',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle>
                  {editingTransactionId ? 'Editar lancamento' : 'Cadastrar lancamento'}
                </CardTitle>
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-xl border border-white/10 p-2 text-slate-300 transition hover:bg-slate-800"
                  aria-label="Fechar formulario de transacao"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmitTransacao}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
              >
                <Input
                  label="Descrição"
                  placeholder="Ex: Entrada projeto comercial"
                  value={novaTransacao.descricao}
                  onChange={(event) =>
                    setNovaTransacao((prev) => ({ ...prev, descricao: event.target.value }))
                  }
                  required
                />
                <label className="block text-sm text-gray-300">
                  <span className="mb-1 block">Tipo</span>
                  <select
                    value={novaTransacao.tipo}
                    onChange={(event) =>
                      setNovaTransacao((prev) => ({
                        ...prev,
                        tipo: event.target.value as LedgerKind,
                      }))
                    }
                    className="w-full rounded-xl border border-white/20 bg-slate-900/50 px-3 py-2.5 text-gray-100 focus:border-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300/35"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </label>
                <Input
                  label="Valor"
                  inputMode="numeric"
                  placeholder="R$ 0,00"
                  value={novaTransacao.valor}
                  onChange={(event) =>
                    setNovaTransacao((prev) => ({
                      ...prev,
                      valor: maskCurrencyBRL(event.target.value),
                    }))
                  }
                  required
                />
                <div className="flex justify-end gap-2 md:col-span-2">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {editingTransactionId ? 'Salvar alterações' : 'Salvar lançamento'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Visao Geral</h2>
          <p className="mt-1 text-sm text-slate-400">
            {financeRows.length} de {scopedTransacoes.length + forecastReceivables.length} registros
            no filtro atual
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/55 p-2">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 'todos', label: 'Todo Periodo' },
              { value: '30', label: 'Ultimos 30 Dias' },
              { value: 'mes', label: 'Este Mes' },
              { value: 'personalizado', label: 'Personalizado' },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setSelectedPeriod(item.value as PeriodFilter)}
                className={[
                  'rounded-xl px-3 py-2 text-xs font-bold transition',
                  selectedPeriod === item.value
                    ? 'bg-slate-800/80 text-cyan-200'
                    : 'text-slate-400 hover:text-slate-100',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-cyan-300 focus:outline-none"
            >
              <option value="todos">Todos os tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>
          </div>
          {selectedPeriod === 'personalizado' && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-2">
              <Input
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                className="py-2 text-xs"
                aria-label="Data inicial"
              />
              <span className="text-xs text-slate-500">ate</span>
              <Input
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                className="py-2 text-xs"
                aria-label="Data final"
              />
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className={`${glassCardClass} flex items-center justify-between p-5`}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Total Receitas</p>
            <h3 className="text-2xl font-semibold text-emerald-300">
              {formatCurrencyBRL(totals.totalReceitas)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-emerald-300">
              <ArrowUp className="h-4 w-4" />
              <span>
                {filteredTransacoes.filter((item) => item.tipo === 'receita').length} entradas
              </span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <Wallet className="h-7 w-7" />
          </div>
        </div>

        <div className={`${glassCardClass} flex items-center justify-between p-5`}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Receita Prevista</p>
            <h3 className="text-2xl font-semibold text-cyan-200">
              {formatCurrencyBRL(totals.totalPrevisto)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-cyan-200">
              <CalendarBlank className="h-4 w-4" />
              <span>{filteredForecasts.length} previsoes pendentes</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
            <CalendarBlank className="h-7 w-7" />
          </div>
        </div>

        <div className={`${glassCardClass} flex items-center justify-between p-5`}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Total Despesas</p>
            <h3 className="text-2xl font-semibold text-rose-300">
              {formatCurrencyBRL(totals.totalDespesas)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-rose-300">
              <ArrowDown className="h-4 w-4" />
              <span>
                {filteredTransacoes.filter((item) => item.tipo === 'despesa').length} saidas
              </span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-400/10 text-rose-300">
            <CalendarBlank className="h-7 w-7" />
          </div>
        </div>

        <div className={`${glassCardClass} flex items-center justify-between p-5`}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Saldo Atual</p>
            <h3
              className={`text-2xl font-semibold ${totals.saldo >= 0 ? 'text-slate-100' : 'text-rose-300'}`}
            >
              {formatCurrencyBRL(totals.saldo)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-slate-400">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              <span>Projetado: {formatCurrencyBRL(totals.saldoProjetado)}</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${glassCardClass} flex min-h-[320px] flex-col p-5`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-100">Fluxo de Caixa</h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                Receitas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
                Previsto
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                Despesas
              </span>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-[72px_1fr] gap-3">
            <div className="relative h-full min-h-[240px] border-r border-white/10 pr-3">
              {barChartTicks.map((tick, index) => (
                <div
                  key={`${tick}-${index}`}
                  className="absolute right-3 text-right text-[10px] text-slate-500"
                  style={{ top: `${index * 31}%` }}
                >
                  {formatCompactCurrency(tick)}
                </div>
              ))}
            </div>
            <div className="relative h-full min-h-[240px] border-b border-white/10 pb-7">
              {barChartTicks.map((tick, index) => (
                <div
                  key={`${tick}-${index}`}
                  className="absolute left-0 right-0 border-t border-white/10"
                  style={{ top: `${index * 31}%` }}
                />
              ))}
              <div className="absolute inset-x-0 bottom-7 top-0 flex items-end justify-between gap-4 px-2">
                {chartData.map((item) => (
                  <div
                    key={item.label}
                    className="relative flex h-full min-w-[42px] flex-1 flex-col items-center justify-end"
                  >
                    <div className="flex h-full items-end gap-1.5">
                      <div
                        className="w-4 rounded-t-sm bg-emerald-300 transition-all"
                        style={{ height: `${item.receitaHeight}%` }}
                        title={`Receitas ${formatCurrencyBRL(item.receitas)}`}
                      />
                      <div
                        className="w-4 rounded-t-sm bg-cyan-300/80 transition-all"
                        style={{ height: `${item.previstoHeight}%` }}
                        title={`Previsto ${formatCurrencyBRL(item.previsto)}`}
                      />
                      <div
                        className="w-4 rounded-t-sm bg-rose-300/70 transition-all"
                        style={{ height: `${item.despesaHeight}%` }}
                        title={`Despesas ${formatCurrencyBRL(item.despesas)}`}
                      />
                    </div>
                    <span className="absolute -bottom-6 text-xs text-slate-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`${glassCardClass} flex min-h-[320px] flex-col p-5`}>
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-100">Evolucao do Saldo</h3>
            <ChartLineUp className="h-5 w-5 text-cyan-200" />
          </div>
          <div className="grid flex-1 grid-cols-[72px_1fr] gap-3">
            <div className="relative min-h-[210px] border-r border-white/10 pr-3">
              {lineChartTicks.map((tick, index) => (
                <div
                  key={`${tick}-${index}`}
                  className="absolute right-3 text-right text-[10px] text-slate-500"
                  style={{ top: `${index * 33}%` }}
                >
                  {formatCompactCurrency(tick)}
                </div>
              ))}
            </div>
            <div className="relative flex min-h-[210px] items-center justify-center">
              <svg className="h-full min-h-[210px] w-full" viewBox="0 0 400 200" role="img">
                <defs>
                  <linearGradient id="finance-line-gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#67e8f9" stopOpacity="0.28" />
                    <stop offset="95%" stopColor="#67e8f9" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {lineChartTicks.map((tick, index) => (
                  <path
                    key={`${tick}-${index}`}
                    d={`M 0 ${20 + index * 53.3} L 400 ${20 + index * 53.3}`}
                    stroke="#475569"
                    strokeDasharray="4"
                    strokeWidth="1"
                  />
                ))}
                <path d={`${saldoPath} L 400 200 H 0 Z`} fill="url(#finance-line-gradient)" />
                <path
                  d={saldoPath}
                  fill="none"
                  stroke="#67e8f9"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <div className="absolute right-6 top-5 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-xl">
                <p className="text-xs text-slate-400">Saldo</p>
                <p className="text-sm font-semibold text-cyan-200">
                  {formatCurrencyBRL(totals.saldo)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-between px-4 text-xs text-slate-400">
            {monthLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${glassCardClass} overflow-hidden`}>
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Transações Recentes</h3>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              icon={<MagnifyingGlass />}
            />
            {(searchTerm ||
              typeFilter !== 'todos' ||
              selectedPeriod !== 'todos' ||
              customFrom ||
              customTo) && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('todos');
                  setSelectedPeriod('todos');
                  setCustomFrom('');
                  setCustomTo('');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/35">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Tipo</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Valor</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Data</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-400">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {recentRows.map((row) => {
                const isForecast = row.kind === 'previsao';
                const descricao = isForecast ? row.previsao.descricao : row.transacao.descricao;
                const categoria = isForecast
                  ? row.previsao.origem === 'projeto'
                    ? 'Projeto'
                    : 'Servico'
                  : row.transacao.categoria;
                const tipo = isForecast ? 'receita' : row.transacao.tipo;
                const valor = isForecast ? row.previsao.valor : row.transacao.valor;
                const data = isForecast ? row.previsao.data : row.transacao.data;

                return (
                  <tr
                    key={isForecast ? row.previsao.id : row.transacao.id}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-slate-100">{descricao}</td>
                    <td className="px-6 py-4 text-sm text-slate-400">{categoria}</td>
                    <td className="px-6 py-4">
                      <span
                        className={[
                          'rounded-full px-3 py-1 text-xs font-bold',
                          tipo === 'receita'
                            ? 'bg-emerald-300/10 text-emerald-300'
                            : 'bg-rose-300/10 text-rose-300',
                        ].join(' ')}
                      >
                        {tipo === 'receita' ? 'Entrada' : 'Saida'}
                      </span>
                    </td>
                    <td
                      className={[
                        'px-6 py-4 text-sm font-semibold',
                        tipo === 'receita' ? 'text-emerald-300' : 'text-rose-300',
                      ].join(' ')}
                    >
                      {tipo === 'receita' ? '+' : '-'} {formatCurrencyBRL(valor)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{formatDateBR(data)}</td>
                    <td className="px-6 py-4">
                      <div
                        className={[
                          'flex items-center gap-2',
                          isForecast ? 'text-cyan-200' : 'text-emerald-300',
                        ].join(' ')}
                      >
                        <span
                          className={[
                            'h-1.5 w-1.5 rounded-full',
                            isForecast ? 'bg-cyan-200' : 'bg-emerald-300',
                          ].join(' ')}
                        />
                        <span className="text-xs">{isForecast ? 'Previsto' : 'Concluido'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {!isForecast && (
                        <button
                          type="button"
                          onClick={() => handleEditTransacao(row.transacao)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 text-slate-400 transition hover:border-cyan-300/45 hover:bg-slate-800/80 hover:text-cyan-200"
                          aria-label="Editar lancamento"
                        >
                          <PencilSimple className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {recentRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-400">
                    Nenhuma transacao financeira encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 p-4 text-xs text-slate-400">
          <span>
            {financeRows.length === 0
              ? 'Nenhum registro'
              : `Mostrando ${pageStart + 1}-${Math.min(
                  pageStart + recentRows.length,
                  financeRows.length,
                )} de ${financeRows.length} registros`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 transition hover:border-cyan-300/45 hover:bg-slate-800/80 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Pagina anterior"
              disabled={safeCurrentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
            >
              <CaretLeft className="h-4 w-4" />
            </button>
            <span className="rounded-xl border border-white/10 bg-slate-900/50 px-3 py-1.5 text-slate-300">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900/50 transition hover:border-cyan-300/45 hover:bg-slate-800/80 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Proxima pagina"
              disabled={safeCurrentPage === totalPages}
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
            >
              <CaretRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
