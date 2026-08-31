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
  DownloadSimple,
  Wallet,
  X,
} from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { formatCurrencyBRL, maskCurrencyBRL, parseCurrencyBRL } from '@/core/utils/masks';
import { projectsService } from '@/features/projects/services/projectsService';
import { servicosService } from '@/features/servicos/services/servicosService';
import { usersService } from '@/features/admin/services/usersService';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import type { Projeto, Servico, User } from '@/types';
import {
  financeiroService,
  type LedgerKind,
  type TransacaoFinanceira,
} from '../services/financeiroService';
import { calculateProjectReceipts } from '../domain/projectFinance';

type TransactionFormState = {
  descricao: string;
  tipo: LedgerKind;
  valor: string;
  data: string;
};

type FinanceTab = 'geral' | 'projetos' | 'servicos';
type PeriodFilter = 'todos' | '30' | 'mes' | 'ano' | 'personalizado';
type TypeFilter = 'todos' | LedgerKind;
type ChartGranularity = 'day' | 'month';

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
  data: new Date().toISOString().slice(0, 10),
});

const glassCardClass =
  'rounded-2xl border border-white/10 bg-slate-900/55 shadow-[0_24px_50px_-30px_rgba(15,23,42,0.95)] backdrop-blur-xl';

const monthLabels = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];
const ROWS_PER_PAGE = 8;
const DAILY_CHART_LIMIT = 14;

const toDateOnly = (date?: string | null) => {
  if (!date) return '';
  const value = date.trim();
  if (!value) return '';

  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (isoDate) return isoDate;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
};

const formatDateBR = (date: string) => {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return '-';

  const parsed = new Date(`${dateOnly}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleDateString('pt-BR');
};
const formatProjectIdentifier = (
  projeto: Pick<Projeto, 'sequence' | 'subsequente' | 'protocolo'>,
) => {
  if (!projeto.sequence) return projeto.protocolo;
  return projeto.subsequente
    ? `${projeto.sequence}/${projeto.subsequente}`
    : String(projeto.sequence);
};
const formatCompactCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);

const normalizeSearchText = (value?: string | null) =>
  (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const parseDateOnly = (date: string) => {
  const dateOnly = toDateOnly(date);
  if (!dateOnly) return null;

  const parsed = new Date(`${dateOnly}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

const formatChartDayLabel = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

const formatChartMonthLabel = (date: Date) =>
  `${monthLabels[date.getMonth()]}/${String(date.getFullYear()).slice(2)}`;

const addDays = (date: Date, amount: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date.getFullYear(), date.getMonth() + amount, 1);
  return next;
};

const getDayDifference = (from: Date, to: Date) =>
  Math.floor((to.getTime() - from.getTime()) / 86_400_000);

const isInsidePeriod = (date: string, period: PeriodFilter, customFrom = '', customTo = '') => {
  if (period === 'todos') return true;

  const dateOnly = toDateOnly(date);
  if (!dateOnly) return false;

  const parsed = new Date(`${dateOnly}T00:00:00`);
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

  if (period === 'ano') {
    return parsed.getFullYear() === today.getFullYear();
  }

  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  return parsed >= thirtyDaysAgo;
};

const resolveChartBuckets = (
  period: PeriodFilter,
  customFrom: string,
  customTo: string,
  dates: string[],
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let granularity: ChartGranularity = 'month';
  let start: Date;
  let end: Date;

  if (period === '30') {
    granularity = 'day';
    end = today;
    start = addDays(today, -29);
  } else if (period === 'mes') {
    granularity = 'day';
    start = new Date(today.getFullYear(), today.getMonth(), 1);
    end = today;
  } else if (period === 'ano') {
    start = new Date(today.getFullYear(), 0, 1);
    end = new Date(today.getFullYear(), 11, 1);
  } else if (period === 'personalizado') {
    const parsedDates = dates.map(parseDateOnly).filter((date): date is Date => Boolean(date));
    const minDate = parsedDates.length
      ? new Date(Math.min(...parsedDates.map((date) => date.getTime())))
      : today;
    const maxDate = parsedDates.length
      ? new Date(Math.max(...parsedDates.map((date) => date.getTime())))
      : today;

    start = parseDateOnly(customFrom) ?? minDate;
    end = parseDateOnly(customTo) ?? maxDate;
    granularity = getDayDifference(start, end) > 30 ? 'month' : 'day';

    if (granularity === 'month') {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end = new Date(end.getFullYear(), end.getMonth(), 1);
    }
  } else {
    const parsedDates = dates.map(parseDateOnly).filter((date): date is Date => Boolean(date));

    if (parsedDates.length === 0) {
      start = new Date(today.getFullYear(), 0, 1);
      end = new Date(today.getFullYear(), 11, 1);
    } else {
      start = new Date(Math.min(...parsedDates.map((date) => date.getTime())));
      end = new Date(Math.max(...parsedDates.map((date) => date.getTime())));
      start = new Date(start.getFullYear(), start.getMonth(), 1);
      end = new Date(end.getFullYear(), end.getMonth(), 1);
    }
  }

  if (start > end) {
    [start, end] = [end, start];
  }

  const buckets: Array<{ key: string; label: string }> = [];

  if (granularity === 'day') {
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      buckets.push({ key: toDateKey(cursor), label: formatChartDayLabel(cursor) });
    }

    return { granularity, buckets };
  }

  for (let cursor = start; cursor <= end; cursor = addMonths(cursor, 1)) {
    buckets.push({ key: toMonthKey(cursor), label: formatChartMonthLabel(cursor) });
  }

  return { granularity, buckets };
};

const getChartBucketKey = (date: string, granularity: ChartGranularity) => {
  const parsed = parseDateOnly(date);
  if (!parsed) return '';
  return granularity === 'day' ? toDateKey(parsed) : toMonthKey(parsed);
};

const resolveMonthlyBuckets = (dates: string[], period?: PeriodFilter) => {
  const parsedDates = dates.map(parseDateOnly).filter((date): date is Date => Boolean(date));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let start: Date;
  let end: Date;

  if (period === 'ano') {
    start = new Date(today.getFullYear(), 0, 1);
    end = new Date(today.getFullYear(), 11, 1);
  } else if (period === '30' || period === 'mes') {
    end = new Date(today.getFullYear(), today.getMonth(), 1);
    start = addMonths(end, -5);
  } else if (parsedDates.length) {
    start = new Date(Math.min(...parsedDates.map((date) => date.getTime())));
    end = new Date(Math.max(...parsedDates.map((date) => date.getTime())));
  } else {
    end = new Date(today.getFullYear(), today.getMonth(), 1);
    start = addMonths(end, -5);
  }

  start = new Date(start.getFullYear(), start.getMonth(), 1);
  end = new Date(end.getFullYear(), end.getMonth(), 1);

  const monthSpan =
    (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth() + 1;

  if (period !== 'ano' && monthSpan < 6) {
    start = addMonths(end, -5);
  }

  const buckets: Array<{ key: string; label: string }> = [];

  for (let cursor = start; cursor <= end; cursor = addMonths(cursor, 1)) {
    buckets.push({ key: toMonthKey(cursor), label: formatChartMonthLabel(cursor) });
  }

  return buckets;
};

const formatReportFileName = () => {
  const timestamp = new Date()
    .toISOString()
    .slice(0, 19)
    .replaceAll('-', '')
    .replaceAll(':', '')
    .replace('T', '');
  return `relatorio-financeiro-${timestamp}.xlsx`;
};

const getProjectDate = (projeto: Projeto) =>
  toDateOnly(projeto.dataAbertura || projeto.dataCriacao) || toDateOnly(new Date().toISOString());

const getVisibleProjectsForUser = (projetos: Projeto[], currentUser: User | null) => {
  if (!currentUser || currentUser.isAdmin) return projetos;

  const userId = normalizeSearchText(currentUser.id);
  const userName = normalizeSearchText(currentUser.name);
  const userEmail = normalizeSearchText(currentUser.email);

  const projectsWithIntegrator = projetos.filter(
    (projeto) =>
      normalizeSearchText(projeto.dadosProjeto.integradorId) ||
      normalizeSearchText(projeto.dadosProjeto.integrador),
  );

  if (projectsWithIntegrator.length === 0) {
    return projetos;
  }

  return projetos.filter((projeto) => {
    const integradorId = normalizeSearchText(projeto.dadosProjeto.integradorId);
    const integrador = normalizeSearchText(projeto.dadosProjeto.integrador);

    return (
      (userId && integradorId === userId) ||
      (userId && integrador === userId) ||
      (userName && integrador === userName) ||
      (userEmail && integrador === userEmail)
    );
  });
};

const getProjectUserKeys = (projeto: Projeto) =>
  [projeto.dadosProjeto.integradorId, projeto.dadosProjeto.integrador]
    .map(normalizeSearchText)
    .filter(Boolean);

const getServiceUserKeys = (servico: Servico) =>
  [
    servico.createdBy,
    (servico as Servico & { userId?: string; usuarioId?: string; responsavelId?: string }).userId,
    (servico as Servico & { userId?: string; usuarioId?: string; responsavelId?: string })
      .usuarioId,
    (servico as Servico & { userId?: string; usuarioId?: string; responsavelId?: string })
      .responsavelId,
  ]
    .map(normalizeSearchText)
    .filter(Boolean);

const entityMatchesUser = (keys: string[], selectedUser: string) =>
  selectedUser === 'todos' || keys.includes(normalizeSearchText(selectedUser));

const buildProjectFinanceRows = (projetos: Projeto[], transacoes: TransacaoFinanceira[]) => {
  const receiptsByProjectId = new Map<string, TransacaoFinanceira[]>();

  transacoes
    .filter((transacao) => transacao.tipo === 'receita' && transacao.projectId)
    .forEach((transacao) => {
      const projectId = transacao.projectId as string;
      receiptsByProjectId.set(projectId, [
        ...(receiptsByProjectId.get(projectId) ?? []),
        transacao,
      ]);
    });

  return projetos
    .map((projeto) => {
      const valorProjeto = Number(projeto.valor) || 0;
      const receipts = receiptsByProjectId.get(projeto.id) ?? [];
      const valorRecebido = receipts.reduce((sum, transacao) => sum + transacao.valor, 0);
      // Todo recebimento registrado ja e um valor pago, mesmo quando ainda nao
      // quita o projeto inteiro. Antes, pagamentos parciais eram zerados aqui e
      // desapareciam do resumo financeiro do integrador.
      const { paid: receitaPaga, remaining: receitaPrevista } = calculateProjectReceipts(
        valorProjeto,
        valorRecebido,
      );
      const lastReceiptDate = receipts
        .map((transacao) => transacao.data)
        .sort((left, right) => right.localeCompare(left))[0];

      return {
        projeto,
        receitaPaga,
        receitaPrevista,
        dataReceita: lastReceiptDate || getProjectDate(projeto),
        dataPrevista: getProjectDate(projeto),
        status: receitaPaga > 0 ? 'pago' : 'aberto',
      };
    })
    .filter((item) => item.receitaPaga > 0 || item.receitaPrevista > 0);
};

const getDailyChartLabels = (rows: Array<{ dataReceita: string; dataPrevista: string }>) =>
  Array.from(new Set(rows.flatMap((row) => [row.dataReceita, row.dataPrevista])))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .slice(-DAILY_CHART_LIMIT);

const UsuarioFinanceiroPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('todos');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    const loadFinanceData = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [nextTransacoes, nextProjetos] = await Promise.all([
          financeiroService.listTransacoes(),
          projectsService.getAll().catch(() => []),
        ]);

        setTransacoes(nextTransacoes);
        setProjetos(nextProjetos);
      } catch (error) {
        console.error('Erro ao carregar financeiro do usuario:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Nao foi possivel carregar seu financeiro.',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadFinanceData();
  }, []);

  const visibleProjects = useMemo(
    () => getVisibleProjectsForUser(projetos, currentUser),
    [currentUser, projetos],
  );

  const projectRows = useMemo(
    () => buildProjectFinanceRows(visibleProjects, transacoes),
    [transacoes, visibleProjects],
  );

  const filteredProjectRows = useMemo(() => {
    const query = normalizeSearchText(searchTerm);

    return projectRows.filter((row) => {
      const matchesPeriod =
        (row.receitaPaga > 0 &&
          isInsidePeriod(row.dataReceita, selectedPeriod, customFrom, customTo)) ||
        (row.receitaPrevista > 0 &&
          isInsidePeriod(row.dataPrevista, selectedPeriod, customFrom, customTo));

      if (!matchesPeriod) return false;
      if (!query) return true;

      return [
        row.projeto.protocolo,
        row.projeto.protocoloConcessionaria,
        row.projeto.cliente.nome,
        row.projeto.dadosProjeto.concessionaria,
      ].some((value) => normalizeSearchText(value).includes(query));
    });
  }, [customFrom, customTo, projectRows, searchTerm, selectedPeriod]);

  const userTotals = useMemo(
    () => ({
      totalReceita: filteredProjectRows.reduce((sum, row) => sum + row.receitaPaga, 0),
      receitaPrevista: filteredProjectRows.reduce((sum, row) => sum + row.receitaPrevista, 0),
      projetosPagos: filteredProjectRows.filter((row) => row.receitaPaga > 0).length,
      projetosAbertos: filteredProjectRows.filter((row) => row.receitaPrevista > 0).length,
    }),
    [filteredProjectRows],
  );

  const dailyChartData = useMemo(() => {
    const labels = getDailyChartLabels(filteredProjectRows);
    const initial = labels.map((date) => ({
      date,
      label: formatDateBR(date),
      receita: 0,
      prevista: 0,
    }));

    filteredProjectRows.forEach((row) => {
      const receitaItem = initial.find((item) => item.date === row.dataReceita);
      if (receitaItem) receitaItem.receita += row.receitaPaga;

      const previstaItem = initial.find((item) => item.date === row.dataPrevista);
      if (previstaItem) previstaItem.prevista += row.receitaPrevista;
    });

    const maxValue = Math.max(...initial.flatMap((item) => [item.receita, item.prevista]), 1);

    return initial.map((item) => ({
      ...item,
      receitaHeight: Math.max((item.receita / maxValue) * 100, item.receita > 0 ? 12 : 4),
      previstaHeight: Math.max((item.prevista / maxValue) * 100, item.prevista > 0 ? 12 : 4),
    }));
  }, [filteredProjectRows]);

  const dailyMaxValue = useMemo(
    () => Math.max(...dailyChartData.flatMap((item) => [item.receita, item.prevista]), 1),
    [dailyChartData],
  );

  const dailyTicks = useMemo(
    () => [dailyMaxValue, dailyMaxValue * 0.66, dailyMaxValue * 0.33, 0],
    [dailyMaxValue],
  );

  const hasFilters = searchTerm || selectedPeriod !== 'todos' || customFrom || customTo;

  return (
    <div className="page-enter space-y-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-200">Meu Financeiro</h1>
          <p className="mt-1 text-sm text-slate-400">
            Receitas de projetos pagos e previsao dos projetos em aberto
          </p>
          {loading && <p className="mt-2 text-xs text-slate-500">Sincronizando com a API...</p>}
          {errorMessage && <p className="mt-2 text-xs text-red-300">{errorMessage}</p>}
        </div>
      </header>

      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">Resumo por projeto</h2>
          <p className="mt-1 text-sm text-slate-400">
            {filteredProjectRows.length} de {projectRows.length} projetos no filtro atual
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-slate-900/55 p-2">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { value: 'todos', label: 'Todo Periodo' },
              { value: '30', label: 'Ultimos 30 Dias' },
              { value: 'mes', label: 'Este Mes' },
              { value: 'ano', label: 'Este Ano' },
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
            <Input
              placeholder="Buscar projeto..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="py-2 text-xs"
              icon={<MagnifyingGlass />}
            />
            {hasFilters && (
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedPeriod('todos');
                  setCustomFrom('');
                  setCustomTo('');
                }}
              >
                Limpar filtros
              </Button>
            )}
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`${glassCardClass} flex items-center justify-between p-5`}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Valores recebidos</p>
            <h3 className="text-2xl font-semibold text-emerald-300">
              {formatCurrencyBRL(userTotals.totalReceita)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-emerald-300">
              <ArrowUp className="h-4 w-4" />
              <span>{userTotals.projetosPagos} projetos com recebimento</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-300">
            <Wallet className="h-7 w-7" />
          </div>
        </div>

        <div className={`${glassCardClass} flex items-center justify-between p-5`}>
          <div>
            <p className="mb-2 text-xs font-bold uppercase text-slate-400">Projetos em aberto</p>
            <h3 className="text-2xl font-semibold text-cyan-200">
              {formatCurrencyBRL(userTotals.receitaPrevista)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-cyan-200">
              <CalendarBlank className="h-4 w-4" />
              <span>{userTotals.projetosAbertos} projetos em aberto</span>
            </div>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
            <CalendarBlank className="h-7 w-7" />
          </div>
        </div>
      </section>

      <section className={`${glassCardClass} flex min-h-[360px] flex-col p-5`}>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-slate-100">Receitas por Dia</h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Valor recebido
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
              Projeto em aberto
            </span>
          </div>
        </div>
        <div className="grid flex-1 grid-cols-[72px_1fr] gap-3">
          <div className="relative h-full min-h-[260px] border-r border-white/10 pr-3">
            {dailyTicks.map((tick, index) => (
              <div
                key={`${tick}-${index}`}
                className="absolute right-3 text-right text-[10px] text-slate-500"
                style={{ top: `${index * 31}%` }}
              >
                {formatCompactCurrency(tick)}
              </div>
            ))}
          </div>
          <div className="relative h-full min-h-[260px] overflow-x-auto border-b border-white/10 pb-9">
            {dailyTicks.map((tick, index) => (
              <div
                key={`${tick}-${index}`}
                className="absolute left-0 right-0 border-t border-white/10"
                style={{ top: `${index * 31}%` }}
              />
            ))}
            <div className="absolute inset-x-0 bottom-9 top-0 flex min-w-[620px] items-end justify-between gap-4 px-2">
              {dailyChartData.map((item) => (
                <div
                  key={item.date}
                  className="relative flex h-full min-w-[42px] flex-1 flex-col items-center justify-end"
                >
                  <div className="flex h-full items-end gap-1.5">
                    <div
                      className="w-5 rounded-t-sm bg-emerald-300 transition-all"
                      style={{ height: `${item.receitaHeight}%` }}
                      title={`Valor recebido ${formatCurrencyBRL(item.receita)}`}
                    />
                    <div
                      className="w-5 rounded-t-sm bg-cyan-300/80 transition-all"
                      style={{ height: `${item.previstaHeight}%` }}
                      title={`Projeto em aberto ${formatCurrencyBRL(item.prevista)}`}
                    />
                  </div>
                  <span className="absolute -bottom-8 whitespace-nowrap text-[10px] text-slate-400">
                    {item.label.slice(0, 5)}
                  </span>
                </div>
              ))}
              {dailyChartData.length === 0 && (
                <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                  Nenhum projeto financeiro encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const AdminFinanceiroPage: React.FC = () => {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [userOptions, setUserOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('todos');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('todos');
  const [userFilter, setUserFilter] = useState('todos');
  const [activeTab, setActiveTab] = useState<FinanceTab>('geral');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [novaTransacao, setNovaTransacao] = useState<TransactionFormState>(
    createEmptyTransactionForm(),
  );
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const loadFinanceData = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextTransacoes, nextProjetos, nextServicos, nextUsers] = await Promise.all([
        financeiroService.listTransacoes(),
        projectsService.getAll().catch(() => []),
        servicosService.list().catch(() => []),
        usersService.getAll().catch(() => []),
      ]);

      setTransacoes(nextTransacoes);
      setProjetos(nextProjetos);
      setServicos(nextServicos);
      setUserOptions(
        nextUsers
          .map((user) => ({ value: user.id, label: user.name.trim() || user.email }))
          .filter((option) => option.value && option.label)
          .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR')),
      );
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel carregar os dados financeiros.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFinanceData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, customFrom, customTo, searchTerm, selectedPeriod, typeFilter, userFilter]);

  const filteredProjetosByUser = useMemo(
    () =>
      userFilter === 'todos'
        ? projetos
        : projetos.filter((projeto) => entityMatchesUser(getProjectUserKeys(projeto), userFilter)),
    [projetos, userFilter],
  );

  const filteredServicosByUser = useMemo(
    () =>
      userFilter === 'todos'
        ? servicos
        : servicos.filter((servico) => entityMatchesUser(getServiceUserKeys(servico), userFilter)),
    [servicos, userFilter],
  );

  const filteredProjectIds = useMemo(
    () => new Set(filteredProjetosByUser.map((projeto) => projeto.id)),
    [filteredProjetosByUser],
  );

  const filteredServiceIds = useMemo(
    () => new Set(filteredServicosByUser.map((servico) => servico.id)),
    [filteredServicosByUser],
  );

  const scopedTransacoes = useMemo(
    () =>
      transacoes.filter((transacao) => {
        const matchesUser =
          userFilter === 'todos' ||
          (transacao.projectId ? filteredProjectIds.has(transacao.projectId) : false) ||
          (transacao.serviceId ? filteredServiceIds.has(transacao.serviceId) : false);
        if (!matchesUser) return false;

        if (activeTab === 'projetos') return Boolean(transacao.projectId);
        if (activeTab === 'servicos') return Boolean(transacao.serviceId);
        return true;
      }),
    [activeTab, filteredProjectIds, filteredServiceIds, transacoes, userFilter],
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
        : filteredProjetosByUser
            .map((projeto) => {
              const total = Number(projeto.valor) || 0;
              const paid = paidByProjectId.get(projeto.id) ?? 0;
              return { projeto, remaining: Math.max(total - paid, 0) };
            })
            .filter((item) => item.remaining > 0)
            .map((projeto) => ({
              id: `projeto:${projeto.projeto.id}`,
              origem: 'projeto' as const,
              descricao: `Previsao pendente do projeto ${formatProjectIdentifier(
                projeto.projeto,
              )} - ${projeto.projeto.cliente.nome}`,
              valor: projeto.remaining,
              data:
                toDateOnly(projeto.projeto.dataAbertura || projeto.projeto.dataCriacao) ||
                toDateOnly(new Date().toISOString()),
              status: 'previsto' as const,
            }));

    const serviceForecasts =
      activeTab === 'projetos'
        ? []
        : filteredServicosByUser
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
              data:
                toDateOnly(servico.servico.dataAbertura || servico.servico.dataCriacao) ||
                toDateOnly(new Date().toISOString()),
              status: 'previsto' as const,
            }));

    return [...projectForecasts, ...serviceForecasts];
  }, [activeTab, filteredProjetosByUser, filteredServicosByUser, transacoes]);

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

  const cashFlowChart = useMemo(
    () =>
      resolveChartBuckets(selectedPeriod, customFrom, customTo, [
        ...filteredTransacoes.map((transacao) => transacao.data),
        ...filteredForecasts.map((previsao) => previsao.data),
      ]),
    [customFrom, customTo, filteredForecasts, filteredTransacoes, selectedPeriod],
  );

  const chartData = useMemo(() => {
    const initial = cashFlowChart.buckets.map((bucket) => ({
      ...bucket,
      receitas: 0,
      previsto: 0,
      despesas: 0,
    }));
    const bucketByKey = new Map(initial.map((item) => [item.key, item]));

    filteredTransacoes.forEach((item) => {
      const bucket = bucketByKey.get(getChartBucketKey(item.data, cashFlowChart.granularity));
      if (!bucket) return;

      if (item.tipo === 'receita') {
        bucket.receitas += item.valor;
      } else {
        bucket.despesas += item.valor;
      }
    });

    filteredForecasts.forEach((item) => {
      const bucket = bucketByKey.get(getChartBucketKey(item.data, cashFlowChart.granularity));
      if (bucket) {
        bucket.previsto += item.valor;
      }
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
  }, [cashFlowChart, filteredForecasts, filteredTransacoes]);

  const cashFlowChartMinWidth = Math.max(chartData.length * 52, 360);

  const balanceChartData = useMemo(() => {
    const dates = [
      ...filteredTransacoes.map((transacao) => transacao.data),
      ...filteredForecasts.map((previsao) => previsao.data),
    ];
    const initial = resolveMonthlyBuckets(dates, selectedPeriod).map((bucket) => ({
      ...bucket,
      saldo: 0,
    }));
    const bucketByKey = new Map(initial.map((item) => [item.key, item]));

    filteredTransacoes.forEach((item) => {
      const bucket = bucketByKey.get(getChartBucketKey(item.data, 'month'));
      if (!bucket) return;
      bucket.saldo += item.tipo === 'receita' ? item.valor : -item.valor;
    });

    filteredForecasts.forEach((item) => {
      const bucket = bucketByKey.get(getChartBucketKey(item.data, 'month'));
      if (bucket) {
        bucket.saldo += item.valor;
      }
    });

    return initial;
  }, [filteredForecasts, filteredTransacoes, selectedPeriod]);

  const saldoLinePath = useMemo(() => {
    const maxSaldo = Math.max(...balanceChartData.map((item) => Math.abs(item.saldo)), 1);
    const xStep = balanceChartData.length > 1 ? 400 / (balanceChartData.length - 1) : 0;
    const points = balanceChartData.map((item, index) => {
      const x = balanceChartData.length > 1 ? index * xStep : 200;
      const y = 100 - (item.saldo / maxSaldo) * 70;
      return `${index === 0 ? 'M' : 'L'} ${x} ${Math.max(20, Math.min(180, y))}`;
    });

    return points.join(' ');
  }, [balanceChartData]);

  const saldoAreaPath = useMemo(() => {
    if (!saldoLinePath || balanceChartData.length < 2) return '';
    return `${saldoLinePath} L 400 200 H 0 Z`;
  }, [balanceChartData.length, saldoLinePath]);

  const barChartMaxValue = useMemo(
    () => Math.max(...chartData.flatMap((item) => [item.receitas, item.despesas]), 1),
    [chartData],
  );

  const barChartTicks = useMemo(
    () => [barChartMaxValue, barChartMaxValue * 0.66, barChartMaxValue * 0.33, 0],
    [barChartMaxValue],
  );

  const lineChartMaxValue = useMemo(
    () => Math.max(...balanceChartData.map((item) => Math.abs(item.saldo)), 1),
    [balanceChartData],
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
    setSubmitAttempted(false);
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
    setSubmitAttempted(true);

    const valor = parseCurrencyBRL(novaTransacao.valor);
    const missingFields = [
      !novaTransacao.descricao.trim() && 'descricao',
      !novaTransacao.data && 'data',
      (Number.isNaN(valor) || valor <= 0) && 'valor',
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setErrorMessage('Preencha os campos obrigatorios do lancamento: descricao, data e valor.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        amount: valor,
        reason: novaTransacao.tipo,
        description: novaTransacao.descricao.trim(),
        paid_at: novaTransacao.data,
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
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel salvar o lancamento financeiro.',
      );
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
      data: transacao.data,
    });
    setSubmitAttempted(false);
    setIsFormOpen(true);
  };

  const tabs: Array<{ id: FinanceTab; label: string }> = [
    { id: 'geral', label: 'Geral' },
    { id: 'projetos', label: 'Projetos' },
    { id: 'servicos', label: 'Servicos' },
  ];
  const selectedUserLabel =
    userOptions.find((option) => option.value === userFilter)?.label ?? userFilter;

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

  const handleGenerateReport = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (financeRows.length === 0) {
      setErrorMessage('Nao ha registros para gerar relatorio com os filtros atuais.');
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const currencyFormat = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
      const applyCurrencyFormat = (
        sheet: import('xlsx').WorkSheet,
        columns: number[],
        startRow = 1,
      ) => {
        const range = XLSX.utils.decode_range(sheet['!ref'] ?? 'A1');

        columns.forEach((column) => {
          for (let row = startRow; row <= range.e.r; row += 1) {
            const address = XLSX.utils.encode_cell({ r: row, c: column });
            const cell = sheet[address];
            if (cell && typeof cell.v === 'number') {
              cell.t = 'n';
              cell.z = currencyFormat;
            }
          }
        });
      };

      const reportRows = financeRows.map((row) => {
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
        const projectId = isForecast
          ? row.previsao.origem === 'projeto'
            ? row.previsao.id.replace(/^projeto:/, '')
            : undefined
          : row.transacao.projectId || undefined;
        const reportProject = projectId
          ? projetos.find((project) => project.id === projectId)
          : undefined;

        return {
          Descricao: descricao,
          Categoria: categoria,
          Tipo: tipo === 'receita' ? 'Entrada' : 'Saida',
          Valor: valor,
          Data: formatDateBR(data),
          Status: isForecast ? 'Previsto' : 'Concluido',
          Origem: isForecast
            ? row.previsao.origem
            : row.transacao.projectId
              ? 'projeto'
              : row.transacao.serviceId
                ? 'servico'
                : 'geral',
          'Protocolo interno': reportProject?.protocolo ?? '-',
          'Protocolo concessionaria': reportProject?.protocoloConcessionaria ?? '-',
        };
      });

      const totalEntradas = filteredTransacoes
        .filter((item) => item.tipo === 'receita')
        .reduce((sum, item) => sum + item.valor, 0);
      const totalSaidas = filteredTransacoes
        .filter((item) => item.tipo === 'despesa')
        .reduce((sum, item) => sum + item.valor, 0);
      const totalPrevisto = filteredForecasts.reduce((sum, item) => sum + item.valor, 0);
      const saldoAtual = totalEntradas - totalSaidas;
      const saldoProjetado = totalEntradas + totalPrevisto - totalSaidas;
      const indicadoresRows = [
        { Indicador: 'Total de entradas', Valor: totalEntradas },
        { Indicador: 'Total de despesas', Valor: totalSaidas },
        { Indicador: 'Saldo total', Valor: saldoAtual },
        { Indicador: 'Receita prevista', Valor: totalPrevisto },
        { Indicador: 'Fluxo de caixa projetado', Valor: saldoProjetado },
        { Indicador: 'Sobrou apos despesas', Valor: saldoAtual },
      ];

      const flowByDate = new Map<
        string,
        { data: string; entradas: number; despesas: number; previsto: number }
      >();
      const getFlowItem = (date: string) => {
        const current = flowByDate.get(date);
        if (current) return current;

        const next = { data: date, entradas: 0, despesas: 0, previsto: 0 };
        flowByDate.set(date, next);
        return next;
      };

      filteredTransacoes.forEach((transacao) => {
        const item = getFlowItem(transacao.data);
        if (transacao.tipo === 'receita') {
          item.entradas += transacao.valor;
        } else {
          item.despesas += transacao.valor;
        }
      });

      filteredForecasts.forEach((previsao) => {
        getFlowItem(previsao.data).previsto += previsao.valor;
      });

      let saldoAcumulado = 0;
      const fluxoRows = Array.from(flowByDate.values())
        .sort((left, right) => left.data.localeCompare(right.data))
        .map((item) => {
          saldoAcumulado += item.entradas - item.despesas;
          return {
            Data: formatDateBR(item.data),
            Entradas: item.entradas,
            Despesas: item.despesas,
            Previsto: item.previsto,
            'Saldo do dia': item.entradas - item.despesas,
            'Saldo acumulado': saldoAcumulado,
            'Saldo projetado': saldoAcumulado + item.previsto,
          };
        });

      const filtersRows = [
        { Filtro: 'Aba', Valor: tabs.find((tab) => tab.id === activeTab)?.label ?? activeTab },
        { Filtro: 'Periodo', Valor: selectedPeriod },
        { Filtro: 'Data inicial', Valor: customFrom || '-' },
        { Filtro: 'Data final', Valor: customTo || '-' },
        { Filtro: 'Tipo', Valor: typeFilter },
        { Filtro: 'Usuario', Valor: userFilter === 'todos' ? 'Todos' : selectedUserLabel },
        { Filtro: 'Busca', Valor: searchTerm || '-' },
        { Filtro: 'Registros', Valor: financeRows.length },
      ];

      const workbook = XLSX.utils.book_new();
      const reportSheet = XLSX.utils.json_to_sheet(reportRows);
      const indicadoresSheet = XLSX.utils.json_to_sheet(indicadoresRows);
      const fluxoSheet = XLSX.utils.json_to_sheet(fluxoRows);
      const filtersSheet = XLSX.utils.json_to_sheet(filtersRows);

      applyCurrencyFormat(reportSheet, [3]);
      applyCurrencyFormat(indicadoresSheet, [1]);
      applyCurrencyFormat(fluxoSheet, [1, 2, 3, 4, 5, 6]);

      reportSheet['!cols'] = [
        { wch: 34 },
        { wch: 18 },
        { wch: 12 },
        { wch: 16 },
        { wch: 14 },
        { wch: 14 },
        { wch: 12 },
        { wch: 22 },
        { wch: 28 },
      ];
      indicadoresSheet['!cols'] = [{ wch: 28 }, { wch: 18 }];
      fluxoSheet['!cols'] = [
        { wch: 14 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
      ];
      filtersSheet['!cols'] = [{ wch: 18 }, { wch: 24 }];

      XLSX.utils.book_append_sheet(workbook, reportSheet, 'Transacoes');
      XLSX.utils.book_append_sheet(workbook, indicadoresSheet, 'Indicadores');
      XLSX.utils.book_append_sheet(workbook, fluxoSheet, 'Fluxo de Caixa');
      XLSX.utils.book_append_sheet(workbook, filtersSheet, 'Filtros');
      XLSX.writeFile(workbook, formatReportFileName());
      setSuccessMessage(`Relatorio gerado com ${financeRows.length} registro(s) filtrado(s).`);
    } catch (error) {
      console.error('Erro ao gerar relatorio financeiro:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Nao foi possivel gerar o relatorio financeiro.',
      );
    }
  };

  return (
    <div className="page-enter space-y-8">
      <header className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-200">Financeiro</h1>
          <p className="mt-1 text-sm text-slate-400">Controle de caixa da OPJ Engenharia</p>
          {loading && <p className="mt-2 text-xs text-slate-500">Sincronizando com a API...</p>}
          {errorMessage && <p className="mt-2 text-xs text-red-300">{errorMessage}</p>}
          {successMessage && <p className="mt-2 text-xs text-emerald-300">{successMessage}</p>}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            onClick={handleGenerateReport}
            disabled={loading || financeRows.length === 0}
          >
            <DownloadSimple className="mr-2 h-4 w-4" />
            Gerar Relatorio
          </Button>
          <Button type="button" onClick={openCreateForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Lancamento
          </Button>
        </div>
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
                  error={
                    submitAttempted && !novaTransacao.descricao.trim()
                      ? 'Informe a descricao.'
                      : undefined
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
                  label="Data"
                  type="date"
                  value={novaTransacao.data}
                  onChange={(event) =>
                    setNovaTransacao((prev) => ({ ...prev, data: event.target.value }))
                  }
                  error={submitAttempted && !novaTransacao.data ? 'Informe a data.' : undefined}
                  required
                />
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
                  error={
                    submitAttempted &&
                    (Number.isNaN(parseCurrencyBRL(novaTransacao.valor)) ||
                      parseCurrencyBRL(novaTransacao.valor) <= 0)
                      ? 'Informe um valor maior que zero.'
                      : undefined
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
              { value: 'ano', label: 'Este Ano' },
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
            <select
              value={userFilter}
              onChange={(event) => setUserFilter(event.target.value)}
              className="rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-xs font-semibold text-slate-200 focus:border-cyan-300 focus:outline-none"
            >
              <option value="todos">Todos os usuarios</option>
              {userOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
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
            <div className="relative h-full min-h-[240px] overflow-x-auto border-b border-white/10 pb-7">
              <div
                className="relative h-full min-h-[213px]"
                style={{ minWidth: `${cashFlowChartMinWidth}px` }}
              >
                {barChartTicks.map((tick, index) => (
                  <div
                    key={`${tick}-${index}`}
                    className="absolute left-0 right-0 border-t border-white/10"
                    style={{ top: `${index * 31}%` }}
                  />
                ))}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between gap-4 px-2">
                  {chartData.map((item) => (
                    <div
                      key={item.key}
                      className="relative flex h-full min-w-[42px] flex-1 flex-col items-center justify-end"
                    >
                      <div className="flex h-full items-end gap-1.5">
                        <div
                          className="w-4 rounded-t-sm bg-emerald-300 transition-all"
                          style={{ height: `${item.receitaHeight}%` }}
                          title={`Receitas ${formatCurrencyBRL(item.receitas)}`}
                        />
                        <div
                          className="w-4 rounded-t-sm bg-rose-300/70 transition-all"
                          style={{ height: `${item.despesaHeight}%` }}
                          title={`Despesas ${formatCurrencyBRL(item.despesas)}`}
                        />
                      </div>
                      <span className="absolute -bottom-6 text-xs text-slate-400">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
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
                {saldoAreaPath && <path d={saldoAreaPath} fill="url(#finance-line-gradient)" />}
                {saldoLinePath && (
                  <path
                    d={saldoLinePath}
                    fill="none"
                    stroke="#67e8f9"
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                )}
              </svg>
              <div className="absolute right-6 top-5 rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 shadow-xl">
                <p className="text-xs text-slate-400">Saldo</p>
                <p className="text-sm font-semibold text-cyan-200">
                  {formatCurrencyBRL(totals.saldo)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-2 overflow-x-auto px-4">
            <div
              className="flex justify-between gap-4 text-xs text-slate-400"
              style={{ minWidth: `${Math.max(balanceChartData.length * 52, 360)}px` }}
            >
              {balanceChartData.map((item) => (
                <span key={item.key} className="whitespace-nowrap">
                  {item.label}
                </span>
              ))}
            </div>
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
              userFilter !== 'todos' ||
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
                  setUserFilter('todos');
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

export const FinanceiroPage: React.FC = () => {
  const currentUser = useCurrentUser();

  if (currentUser && !currentUser.isAdmin) {
    return <UsuarioFinanceiroPage />;
  }

  return <AdminFinanceiroPage />;
};
