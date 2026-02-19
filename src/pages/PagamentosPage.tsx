import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, CurrencyDollar, WarningCircle } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { formatCurrencyBRL } from '../utils/masks';

interface Pagamento {
  id: string;
  fornecedor: string;
  descricao: string;
  vencimento: string;
  valor: number;
  status: 'agendado' | 'atrasado' | 'pago';
}

const pagamentosMock: Pagamento[] = [
  { id: '1', fornecedor: 'Solaris Equipamentos', descricao: 'Compra de inversores', vencimento: '2026-02-18', valor: 12450, status: 'agendado' },
  { id: '2', fornecedor: 'Logistica Sul', descricao: 'Frete de modulos', vencimento: '2026-02-10', valor: 1890, status: 'atrasado' },
  { id: '3', fornecedor: 'Energia Limpa LTDA', descricao: 'Estruturas metalicas', vencimento: '2026-02-06', valor: 5320, status: 'pago' }
];

export const PagamentosPage: React.FC = () => {
  const totalAPagar = pagamentosMock.filter((item) => item.status !== 'pago').reduce((sum, item) => sum + item.valor, 0);
  const totalAtrasado = pagamentosMock.filter((item) => item.status === 'atrasado').reduce((sum, item) => sum + item.valor, 0);

  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const getStatusBadge = (status: Pagamento['status']) => {
    if (status === 'pago') return 'bg-green-900/50 text-green-300 border-green-700';
    if (status === 'atrasado') return 'bg-red-900/50 text-red-300 border-red-700';
    return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  };

  const getStatusLabel = (status: Pagamento['status']) => {
    if (status === 'pago') return 'Pago';
    if (status === 'atrasado') return 'Atrasado';
    return 'Agendado';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Pagamentos</h1>
          <p className="text-gray-400 mt-1">Esboco inicial para contas a pagar da operacao.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/financeiro">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao financeiro
            </Button>
          </Link>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Agendar pagamento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total a pagar</p>
              <p className="text-2xl font-bold text-yellow-400">{formatCurrencyBRL(totalAPagar)}</p>
            </div>
            <CurrencyDollar className="h-8 w-8 text-yellow-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Atrasado</p>
              <p className="text-2xl font-bold text-red-400">{formatCurrencyBRL(totalAtrasado)}</p>
            </div>
            <WarningCircle className="h-8 w-8 text-red-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Proximo passo</p>
            <p className="text-gray-100 mt-2">Conectar com API de financeiro e regras de aprovacao.</p>
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
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Fornecedor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Descricao</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Vencimento</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosMock.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100">{item.fornecedor}</td>
                    <td className="py-3 px-4 text-gray-100">{item.descricao}</td>
                    <td className="py-3 px-4 text-gray-100">{formatDateBR(item.vencimento)}</td>
                    <td className="py-3 px-4 text-gray-100 font-medium">{formatCurrencyBRL(item.valor)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
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
