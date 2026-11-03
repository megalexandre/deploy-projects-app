import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowsClockwise,
  CaretDown,
  CaretUp,
  ChartLineUp,
  MagnifyingGlass,
  Receipt,
  Wallet,
} from '@phosphor-icons/react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/shared/components/Button';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { LedgerEntryActions } from '../components/LedgerEntryActions';
import {
  financeiroService,
  type LedgerKind,
  type TransacaoFinanceira,
} from '../services/financeiroService';

type TypeFilter = 'todos' | LedgerKind;
type PeriodFilter = '30' | '90' | '180' | '365' | 'todos';
type LinkKind = 'Projetos' | 'Serviços' | 'Avulsos';

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
});

const compactBRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const monthFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
});

const PIE_COLORS: Record<LinkKind, string> = {
  Projetos: '#22d3ee',
  Serviços: '#f59e0b',
  Avulsos: '#8b5cf6',
};

const getLinkKind = (transaction: TransacaoFinanceira): LinkKind => {
  if (transaction.projectId) return 'Projetos';
  if (transaction.serviceId) return 'Serviços';
  return 'Avulsos';
};

const parseDate = (value: string) => new Date(`${value.slice(0, 10)}T12:00:00Z`);

const formatDate = (value: string) => {
  const parsed = parseDate(value);
  return Number.isNaN(parsed.getTime()) ? 'Data não informada' : dateFormatter.format(parsed);
};

const getMonthKey = (value: string) => value.slice(0, 7);

const percent = (value: number, total: number) => (total > 0 ? (value / total) * 100 : 0);

const PaginationControls: React.FC<{
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}> = ({ page, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages);
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Mostrar</span>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label="Quantidade de registros por página"
          className="!rounded-lg !px-2 !py-1.5 text-xs"
        >
          {[10, 20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>por página</span>
      </div>
      <div className="flex items-center gap-3">
        <span>
          {firstItem}–{lastItem} de {totalItems}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Anterior
          </button>
          <span className="flex min-w-14 items-center justify-center rounded-lg bg-slate-950/40 px-2 py-1.5 font-semibold text-slate-300">
            {currentPage}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="rounded-lg border border-white/10 bg-slate-800 px-2.5 py-1.5 font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-35"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  title: string;
  value: number;
  helper: string;
  tone: 'income' | 'expense' | 'balance';
  icon: React.ElementType;
  active?: boolean;
  onClick?: () => void;
}> = ({ title, value, helper, tone, icon: Icon, active, onClick }) => {
  const styles = {
    income: {
      border: 'border-emerald-400/25',
      surface: 'from-emerald-500/15 to-emerald-500/5',
      icon: 'bg-emerald-400/15 text-emerald-300',
      value: 'text-emerald-300',
    },
    expense: {
      border: 'border-rose-400/25',
      surface: 'from-rose-500/15 to-rose-500/5',
      icon: 'bg-rose-400/15 text-rose-300',
      value: 'text-rose-300',
    },
    balance: {
      border: 'border-cyan-400/25',
      surface: 'from-cyan-500/15 to-blue-500/5',
      icon: 'bg-cyan-400/15 text-cyan-300',
      value: value >= 0 ? 'text-cyan-300' : 'text-rose-300',
    },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border bg-gradient-to-br p-5 text-left transition hover:-translate-y-0.5 hover:brightness-110 ${styles.border} ${styles.surface} ${
        active ? 'ring-2 ring-cyan-300/50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{title}</p>
          <p className={`mt-3 text-2xl font-extrabold tracking-tight ${styles.value}`}>
            {BRL.format(value)}
          </p>
          <p className="mt-2 text-xs text-slate-400">{helper}</p>
        </div>
        <span className={`rounded-xl p-2.5 ${styles.icon}`}>
          <Icon className="h-5 w-5" weight="bold" />
        </span>
      </div>
    </button>
  );
};

const AdminFinanceiroV2Page: React.FC = () => {
  const [transactions, setTransactions] = useState<TransacaoFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState<PeriodFilter>('180');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);
  const [detailPagination, setDetailPagination] = useState({
    income: { page: 1, pageSize: 10 },
    expense: { page: 1, pageSize: 10 },
  });

  const loadTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      setTransactions(await financeiroService.listTransacoes());
    } catch (requestError) {
      console.error('Erro ao carregar o painel financeiro comparativo:', requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Não foi possível carregar os lançamentos financeiros.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  const periodTransactions = useMemo(() => {
    if (period === 'todos') return transactions;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - Number(period));
    return transactions.filter((transaction) => parseDate(transaction.data) >= cutoff);
  }, [period, transactions]);

  const totals = useMemo(() => {
    const income = periodTransactions
      .filter((transaction) => transaction.tipo === 'receita')
      .reduce((sum, transaction) => sum + transaction.valor, 0);
    const expense = periodTransactions
      .filter((transaction) => transaction.tipo === 'despesa')
      .reduce((sum, transaction) => sum + transaction.valor, 0);
    return { income, expense, balance: income - expense };
  }, [periodTransactions]);

  const visibleTransactions = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
    return [...periodTransactions]
      .filter((transaction) => typeFilter === 'todos' || transaction.tipo === typeFilter)
      .filter((transaction) => {
        if (!normalizedSearch) return true;
        return [
          transaction.descricao,
          transaction.ledger.reason ?? '',
          transaction.projectId ?? '',
          transaction.serviceId ?? '',
        ].some((value) => value.toLocaleLowerCase('pt-BR').includes(normalizedSearch));
      })
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [periodTransactions, search, typeFilter]);

  const monthlyData = useMemo(() => {
    const buckets = new Map<string, { month: string; receitas: number; despesas: number }>();
    periodTransactions.forEach((transaction) => {
      const key = getMonthKey(transaction.data);
      const current = buckets.get(key) ?? { month: key, receitas: 0, despesas: 0 };
      if (transaction.tipo === 'receita') current.receitas += transaction.valor;
      else current.despesas += transaction.valor;
      buckets.set(key, current);
    });

    return [...buckets.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map((item) => ({
        ...item,
        label: monthFormatter.format(new Date(`${item.month}-01T12:00:00Z`)).replace('.', ''),
        saldo: item.receitas - item.despesas,
      }));
  }, [periodTransactions]);

  const linkBreakdown = useMemo(() => {
    const base: Record<LinkKind, { income: number; expense: number }> = {
      Projetos: { income: 0, expense: 0 },
      Serviços: { income: 0, expense: 0 },
      Avulsos: { income: 0, expense: 0 },
    };
    periodTransactions.forEach((transaction) => {
      const item = base[getLinkKind(transaction)];
      if (transaction.tipo === 'receita') item.income += transaction.valor;
      else item.expense += transaction.valor;
    });
    return (Object.entries(base) as Array<[LinkKind, { income: number; expense: number }]>).map(
      ([name, values]) => ({ name, ...values, total: values.income + values.expense }),
    );
  }, [periodTransactions]);

  const detailGroups = useMemo(
    () => ({
      income: visibleTransactions.filter((item) => item.tipo === 'receita'),
      expense: visibleTransactions.filter((item) => item.tipo === 'despesa'),
    }),
    [visibleTransactions],
  );

  useEffect(() => {
    setTablePage(1);
    setDetailPagination((current) => ({
      income: { ...current.income, page: 1 },
      expense: { ...current.expense, page: 1 },
    }));
  }, [period, search, typeFilter]);

  const pagedTransactions = useMemo(() => {
    const totalPages = Math.max(1, Math.ceil(visibleTransactions.length / tablePageSize));
    const currentPage = Math.min(tablePage, totalPages);
    const start = (currentPage - 1) * tablePageSize;
    return visibleTransactions.slice(start, start + tablePageSize);
  }, [tablePage, tablePageSize, visibleTransactions]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-enter mx-auto max-w-[1600px] space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-cyan-200">
              Versão comparativa
            </span>
            <span className="text-xs text-slate-500">A tela financeira atual foi preservada</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
            Visão financeira
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
            Entradas, saídas e saldo separados para uma leitura mais rápida do caixa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/financeiro"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Ver página atual
          </Link>
          <Button variant="outline" onClick={() => void loadTransactions()}>
            <ArrowsClockwise className="mr-2 h-4 w-4" />
            Atualizar dados
          </Button>
        </div>
      </section>

      {error && <ErrorAlert message={error} />}

      <section className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Filtrar período">
          {(
            [
              ['30', '30 dias'],
              ['90', '90 dias'],
              ['180', '6 meses'],
              ['365', '1 ano'],
              ['todos', 'Todo período'],
            ] as Array<[PeriodFilter, string]>
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition sm:text-sm ${
                period === value
                  ? 'bg-cyan-400 text-slate-950'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {periodTransactions.length} lançamento{periodTransactions.length === 1 ? '' : 's'} no
          período
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Entradas"
          value={totals.income}
          helper={`${detailGroups.income.length} recebimento${detailGroups.income.length === 1 ? '' : 's'}`}
          tone="income"
          icon={ArrowUp}
          active={typeFilter === 'receita'}
          onClick={() => setTypeFilter(typeFilter === 'receita' ? 'todos' : 'receita')}
        />
        <StatCard
          title="Saídas"
          value={totals.expense}
          helper={`${detailGroups.expense.length} pagamento${detailGroups.expense.length === 1 ? '' : 's'}`}
          tone="expense"
          icon={ArrowDown}
          active={typeFilter === 'despesa'}
          onClick={() => setTypeFilter(typeFilter === 'despesa' ? 'todos' : 'despesa')}
        />
        <StatCard
          title="Saldo do período"
          value={totals.balance}
          helper={totals.balance >= 0 ? 'Caixa positivo no período' : 'Saídas acima das entradas'}
          tone="balance"
          icon={Wallet}
          active={typeFilter === 'todos'}
          onClick={() => setTypeFilter('todos')}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.8fr)]">
        <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Fluxo de caixa mensal</h2>
              <p className="text-xs text-slate-400">Comparativo de entradas, saídas e saldo</p>
            </div>
            <div className="mt-2 flex items-center gap-3 text-xs sm:mt-0">
              <span className="flex items-center gap-1.5 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Entradas
              </span>
              <span className="flex items-center gap-1.5 text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-400" /> Saídas
              </span>
            </div>
          </div>
          {monthlyData.length ? (
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyData}
                  barGap={4}
                  margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                  />
                  <YAxis
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    tickFormatter={(value: number) => compactBRL.format(value)}
                    width={74}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(148,163,184,.25)',
                      borderRadius: 12,
                      color: '#e2e8f0',
                    }}
                    formatter={(value) => BRL.format(Number(value))}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Bar
                    dataKey="receitas"
                    name="Entradas"
                    fill="#34d399"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="despesas"
                    name="Saídas"
                    fill="#fb7185"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={30}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    name="Saldo"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    dot={{ fill: '#22d3ee', r: 3 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[340px] items-center justify-center text-sm text-slate-500">
              Sem movimentações para exibir neste período.
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/55 p-5 sm:p-6">
          <h2 className="text-lg font-bold text-slate-100">Origem das movimentações</h2>
          <p className="text-xs text-slate-400">Volume total por tipo de vínculo</p>
          {linkBreakdown.some((item) => item.total > 0) ? (
            <>
              <div className="relative h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={linkBreakdown}
                      dataKey="total"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={88}
                      paddingAngle={4}
                      stroke="none"
                    >
                      {linkBreakdown.map((item) => (
                        <Cell key={item.name} fill={PIE_COLORS[item.name]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0f172a',
                        border: '1px solid rgba(148,163,184,.25)',
                        borderRadius: 12,
                        color: '#e2e8f0',
                      }}
                      formatter={(value) => BRL.format(Number(value))}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-slate-500">Movimentado</span>
                  <strong className="mt-1 text-lg text-slate-100">
                    {compactBRL.format(totals.income + totals.expense)}
                  </strong>
                </div>
              </div>
              <div className="space-y-3">
                {linkBreakdown.map((item) => (
                  <div key={item.name} className="rounded-xl bg-slate-950/35 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[item.name] }}
                        />
                        {item.name}
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {BRL.format(item.total)}
                      </span>
                    </div>
                    <div className="mt-2 flex justify-between text-[11px]">
                      <span className="text-emerald-300">+ {BRL.format(item.income)}</span>
                      <span className="text-rose-300">− {BRL.format(item.expense)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
              Sem dados para detalhar.
            </div>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          {
            key: 'income' as const,
            title: 'Detalhamento das entradas',
            icon: ArrowUp,
            color: 'emerald',
            total: totals.income,
          },
          {
            key: 'expense' as const,
            title: 'Detalhamento das saídas',
            icon: ArrowDown,
            color: 'rose',
            total: totals.expense,
          },
        ].map((group) => {
          const pagination = detailPagination[group.key];
          const totalPages = Math.max(
            1,
            Math.ceil(detailGroups[group.key].length / pagination.pageSize),
          );
          const currentPage = Math.min(pagination.page, totalPages);
          const start = (currentPage - 1) * pagination.pageSize;
          const items = detailGroups[group.key].slice(start, start + pagination.pageSize);
          const Icon = group.icon;
          return (
            <article
              key={group.key}
              className={`rounded-2xl border bg-slate-900/55 p-5 sm:p-6 ${
                group.color === 'emerald' ? 'border-emerald-400/20' : 'border-rose-400/20'
              }`}
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-xl p-2 ${
                      group.color === 'emerald'
                        ? 'bg-emerald-400/15 text-emerald-300'
                        : 'bg-rose-400/15 text-rose-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" weight="bold" />
                  </span>
                  <div>
                    <h2 className="font-bold text-slate-100">{group.title}</h2>
                    <p className="text-xs text-slate-400">Lançamentos separados por tipo</p>
                  </div>
                </div>
                <strong
                  className={`text-sm ${
                    group.color === 'emerald' ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {BRL.format(group.total)}
                </strong>
              </div>
              <div className="space-y-2">
                {items.length ? (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-xl bg-slate-950/35 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-200">
                          {item.descricao}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {formatDate(item.data)} · {getLinkKind(item)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-sm font-bold ${
                          group.color === 'emerald' ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {group.key === 'income' ? '+' : '−'} {BRL.format(item.valor)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl bg-slate-950/35 px-4 py-8 text-center text-sm text-slate-500">
                    Nenhum lançamento deste tipo.
                  </p>
                )}
              </div>
              <div className="mt-4 border-t border-white/10 pt-4">
                <PaginationControls
                  page={currentPage}
                  pageSize={pagination.pageSize}
                  totalItems={detailGroups[group.key].length}
                  onPageChange={(page) =>
                    setDetailPagination((current) => ({
                      ...current,
                      [group.key]: { ...current[group.key], page },
                    }))
                  }
                  onPageSizeChange={(pageSize) =>
                    setDetailPagination((current) => ({
                      ...current,
                      [group.key]: { page: 1, pageSize },
                    }))
                  }
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55">
        <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
              <Receipt className="h-5 w-5 text-cyan-300" />
              Todos os lançamentos
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Clique em uma linha para ver os dados completos
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar lançamento..."
                className="w-full rounded-xl border border-white/15 bg-slate-950/45 py-2.5 pl-9 pr-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 sm:w-64"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              aria-label="Filtrar por tipo"
              className="text-sm"
            >
              <option value="todos">Entradas e saídas</option>
              <option value="receita">Somente entradas</option>
              <option value="despesa">Somente saídas</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[820px]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left">Lançamento</th>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Vínculo</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-right">Valor</th>
                <th className="w-12 px-3 py-3" aria-label="Detalhes" />
              </tr>
            </thead>
            <tbody>
              {pagedTransactions.map((transaction) => {
                const isIncome = transaction.tipo === 'receita';
                const expanded = expandedId === transaction.id;
                return (
                  <React.Fragment key={transaction.id}>
                    <tr
                      onClick={() => setExpandedId(expanded ? null : transaction.id)}
                      className="cursor-pointer border-b border-white/[0.06]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-lg p-2 ${
                              isIncome
                                ? 'bg-emerald-400/15 text-emerald-300'
                                : 'bg-rose-400/15 text-rose-300'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )}
                          </span>
                          <span className="max-w-sm truncate font-semibold text-slate-200">
                            {transaction.descricao}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {formatDate(transaction.data)}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                          {getLinkKind(transaction)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            isIncome
                              ? 'bg-emerald-400/12 text-emerald-300'
                              : 'bg-rose-400/12 text-rose-300'
                          }`}
                        >
                          {isIncome ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-extrabold ${
                          isIncome ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                      >
                        {isIncome ? '+' : '−'} {BRL.format(transaction.valor)}
                      </td>
                      <td className="px-3 py-4 text-slate-500">
                        {expanded ? (
                          <CaretUp className="h-4 w-4" />
                        ) : (
                          <CaretDown className="h-4 w-4" />
                        )}
                      </td>
                    </tr>
                    {expanded && (
                      <tr className="border-b border-white/[0.06] bg-slate-950/30">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <span className="text-slate-500">Motivo original</span>
                              <p className="mt-1 font-semibold text-slate-300">
                                {transaction.ledger.reason || 'Não informado'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Projeto</span>
                              <p className="mt-1 break-all font-semibold text-slate-300">
                                {transaction.projectId || 'Sem vínculo'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Serviço</span>
                              <p className="mt-1 break-all font-semibold text-slate-300">
                                {transaction.serviceId || 'Sem vínculo'}
                              </p>
                            </div>
                            <div>
                              <span className="text-slate-500">Código do lançamento</span>
                              <p className="mt-1 break-all font-semibold text-slate-300">
                                {transaction.id}
                              </p>
                            </div>
                          </div>
                          <div className="mt-4">
                            <LedgerEntryActions
                              transaction={transaction}
                              onChanged={loadTransactions}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {!visibleTransactions.length && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <ChartLineUp className="h-10 w-10 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-300">Nenhum lançamento encontrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Ajuste o período, o tipo ou o termo de busca.
            </p>
          </div>
        )}

        <div className="space-y-3 border-t border-white/10 px-6 py-4">
          <PaginationControls
            page={tablePage}
            pageSize={tablePageSize}
            totalItems={visibleTransactions.length}
            onPageChange={setTablePage}
            onPageSizeChange={(pageSize) => {
              setTablePageSize(pageSize);
              setTablePage(1);
            }}
          />
          <p className="text-right text-[11px] text-slate-500">
            Entradas representam {percent(totals.income, totals.income + totals.expense).toFixed(1)}
            % do volume movimentado
          </p>
        </div>
      </section>
    </div>
  );
};

export { AdminFinanceiroV2Page };
