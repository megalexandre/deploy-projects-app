/** Pagina 'PagamentosPage': lista e cadastra despesas em /ledgers. */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CurrencyDollar, WarningCircle, X } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { formatCurrencyBRL, maskCurrencyBRL, parseCurrencyBRL } from '@/core/utils/masks';
import { financeiroService, type TransacaoFinanceira } from '../services/financeiroService';

const emptyForm = {
  descricao: '',
  valor: '',
};

export const PagamentosPage: React.FC = () => {
  const [pagamentos, setPagamentos] = useState<TransacaoFinanceira[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPagamentos = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const transacoes = await financeiroService.listTransacoes();
      setPagamentos(transacoes.filter((item) => item.tipo === 'despesa'));
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      setErrorMessage('Nao foi possivel carregar os pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPagamentos();
  }, []);

  const totalPago = pagamentos.reduce((sum, item) => sum + item.valor, 0);

  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const valor = parseCurrencyBRL(form.valor);
    if (!form.descricao.trim() || Number.isNaN(valor) || valor <= 0) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await financeiroService.createLedger({
        amount: valor,
        reason: 'despesa',
        description: form.descricao.trim(),
      });
      setForm(emptyForm);
      setFormOpen(false);
      await loadPagamentos();
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      setErrorMessage('Nao foi possivel registrar o pagamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Pagamentos</h1>
          <p className="text-gray-400 mt-1">Despesas registradas no financeiro.</p>
          {loading && <p className="text-xs text-gray-500 mt-1">Sincronizando com a API...</p>}
          {errorMessage && <p className="text-xs text-red-300 mt-1">{errorMessage}</p>}
        </div>
        <div className="flex gap-2">
          <Link to="/financeiro">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao financeiro
            </Button>
          </Link>
          <Button onClick={() => setFormOpen((current) => !current)}>
            <Calendar className="h-4 w-4 mr-2" />
            Registrar pagamento
          </Button>
        </div>
      </div>

      {formOpen && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Novo pagamento</CardTitle>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-white/10 p-2 text-slate-300 transition hover:bg-slate-800"
                aria-label="Fechar formulario de pagamento"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Descrição"
                placeholder="Ex: Compra de inversores"
                value={form.descricao}
                onChange={(event) =>
                  setForm((current) => ({ ...current, descricao: event.target.value }))
                }
                required
              />
              <Input
                label="Valor"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={form.valor}
                onChange={(event) =>
                  setForm((current) => ({ ...current, valor: maskCurrencyBRL(event.target.value) }))
                }
                required
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={loading}>
                  Salvar pagamento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total pago</p>
              <p className="text-2xl font-bold text-yellow-400">{formatCurrencyBRL(totalPago)}</p>
            </div>
            <CurrencyDollar className="h-8 w-8 text-yellow-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Lancamentos</p>
              <p className="text-2xl font-bold text-red-400">{pagamentos.length}</p>
            </div>
            <WarningCircle className="h-8 w-8 text-red-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Origem</p>
            <p className="text-gray-100 mt-2">Dados carregados de /ledgers com reason despesa.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Descrição</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Data</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100">{item.descricao}</td>
                    <td className="py-3 px-4 text-gray-100">{formatDateBR(item.data)}</td>
                    <td className="py-3 px-4 text-gray-100 font-medium">
                      {formatCurrencyBRL(item.valor)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium border bg-green-900/50 text-green-300 border-green-700">
                        Pago
                      </span>
                    </td>
                  </tr>
                ))}
                {pagamentos.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 px-4 text-center text-gray-400">
                      Nenhum pagamento registrado.
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
