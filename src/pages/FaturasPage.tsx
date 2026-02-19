import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, FilePdf, FunnelSimple } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Button } from '../components/Button';

interface Fatura {
  id: string;
  numero: string;
  cliente: string;
  referencia: string;
  emissao: string;
  valor: string;
  status: 'emitida' | 'enviada' | 'paga';
}

const faturasMock: Fatura[] = [
  { id: '1', numero: 'FAT-2026-0017', cliente: 'Condominio Vale Verde', referencia: 'Janeiro/2026', emissao: '2026-02-02', valor: 'R$ 24.500,00', status: 'enviada' },
  { id: '2', numero: 'FAT-2026-0018', cliente: 'Mercado Nova Era', referencia: 'Janeiro/2026', emissao: '2026-02-03', valor: 'R$ 11.200,00', status: 'paga' },
  { id: '3', numero: 'FAT-2026-0019', cliente: 'Carlos Santos', referencia: 'Fevereiro/2026', emissao: '2026-02-09', valor: 'R$ 7.800,00', status: 'emitida' }
];

export const FaturasPage: React.FC = () => {
  const formatDateBR = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR');

  const getStatusBadge = (status: Fatura['status']) => {
    if (status === 'paga') return 'bg-green-900/50 text-green-300 border-green-700';
    if (status === 'enviada') return 'bg-blue-900/50 text-blue-300 border-blue-700';
    return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
  };

  const getStatusLabel = (status: Fatura['status']) => {
    if (status === 'paga') return 'Paga';
    if (status === 'enviada') return 'Enviada';
    return 'Emitida';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Faturas</h1>
          <p className="text-gray-400 mt-1">Esboco para emissao e acompanhamento de faturas.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/financeiro">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao financeiro
            </Button>
          </Link>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Nova fatura
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-gray-300">Estrutura pronta para incluir filtros por cliente, periodo e status.</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <FunnelSimple className="h-4 w-4 mr-2" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm">
                <FilePdf className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historico de faturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Numero</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Cliente</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Referencia</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Emissao</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Valor</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {faturasMock.map((fatura) => (
                  <tr key={fatura.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-gray-100">{fatura.numero}</td>
                    <td className="py-3 px-4 text-gray-100">{fatura.cliente}</td>
                    <td className="py-3 px-4 text-gray-100">{fatura.referencia}</td>
                    <td className="py-3 px-4 text-gray-100">{formatDateBR(fatura.emissao)}</td>
                    <td className="py-3 px-4 text-gray-100">{fatura.valor}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(fatura.status)}`}>
                        {getStatusLabel(fatura.status)}
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
