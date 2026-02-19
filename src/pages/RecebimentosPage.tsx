import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bank, CurrencyCircleDollar, TrendUp } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';
import { formatCurrencyBRL } from '../utils/masks';

interface Recebimento {
  id: string;
  cliente: string;
  projeto: string;
  previsao: string;
  valor: number;
  status: 'a_receber' | 'recebido' | 'vencido';
}

const recebimentosMock: Recebimento[] = [
  { id: '1', cliente: 'Carlos Santos', projeto: 'UFV Residencial 12kWp', previsao: '2026-02-20', valor: 7800, status: 'a_receber' },
  { id: '2', cliente: 'Condominio Vale Verde', projeto: 'Sistema compartilhado 75kWp', previsao: '2026-02-12', valor: 24500, status: 'vencido' },
  { id: '3', cliente: 'Mercado Nova Era', projeto: 'Retrofit comercial 30kWp', previsao: '2026-02-04', valor: 11200, status: 'recebido' }
];

export const RecebimentosPage: React.FC = () => {
  const totalPrevisto = recebimentosMock.filter((item) => item.status !== 'recebido').reduce((sum, item) => sum + item.valor, 0);
  const totalRecebido = recebimentosMock.filter((item) => item.status === 'recebido').reduce((sum, item) => sum + item.valor, 0);

  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const getStatusBadge = (status: Recebimento['status']) => {
    if (status === 'recebido') return 'bg-green-900/50 text-green-300 border-green-700';
    if (status === 'vencido') return 'bg-red-900/50 text-red-300 border-red-700';
    return 'bg-blue-900/50 text-blue-300 border-blue-700';
  };

  const getStatusLabel = (status: Recebimento['status']) => {
    if (status === 'recebido') return 'Recebido';
    if (status === 'vencido') return 'Vencido';
    return 'A receber';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Recebimentos</h1>
          <p className="text-gray-400 mt-1">Esboco inicial para contas a receber por cliente e projeto.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/financeiro">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao financeiro
            </Button>
          </Link>
          <Button>
            <Bank className="h-4 w-4 mr-2" />
            Registrar recebimento
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total previsto</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrencyBRL(totalPrevisto)}</p>
            </div>
            <CurrencyCircleDollar className="h-8 w-8 text-blue-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Recebido no periodo</p>
              <p className="text-2xl font-bold text-green-400">{formatCurrencyBRL(totalRecebido)}</p>
            </div>
            <TrendUp className="h-8 w-8 text-green-400" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-400">Proximo passo</p>
            <p className="text-gray-100 mt-2">Adicionar regras de cobranca, juros e comprovantes.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda de recebimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Projeto</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Previsao</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recebimentosMock.map((item) => (
                  <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100">{item.cliente}</td>
                    <td className="py-3 px-4 text-gray-100">{item.projeto}</td>
                    <td className="py-3 px-4 text-gray-100">{formatDateBR(item.previsao)}</td>
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
