/** Pagina 'ServicosPage': orquestra estado da tela, eventos do usuario e renderizacao dos componentes. */
import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardContent } from '../components/Card';
import { servicosService } from '../services';
import type { PaginatedResponse, Servico } from '../types';

type KanbanStatus = 'pendente' | 'em_andamento' | 'concluido';

const columns: Array<{ id: KanbanStatus; label: string; className: string }> = [
  { id: 'pendente', label: 'Pendente', className: 'border-yellow-700/60 bg-yellow-900/20' },
  { id: 'em_andamento', label: 'Em Andamento', className: 'border-sky-700/60 bg-sky-900/20' },
  { id: 'concluido', label: 'Concluido', className: 'border-emerald-700/60 bg-emerald-900/20' }
];

const fallbackServicos: Servico[] = [
  {
    id: '1',
    nome: 'Manutencao Preventiva',
    cliente: 'Joao Silva',
    status: 'pendente',
    data: '2026-02-22',
    valor: 500
  },
  {
    id: '2',
    nome: 'Instalacao de Paineis',
    cliente: 'Maria Santos',
    status: 'em_andamento',
    data: '2026-02-22',
    valor: 2500
  },
  {
    id: '3',
    nome: 'Vistoria Tecnica',
    cliente: 'Carlos Oliveira',
    status: 'concluido',
    data: '2026-02-22',
    valor: 300
  }
];

const extractList = (response: Servico[] | PaginatedResponse<Servico>): Servico[] =>
  Array.isArray(response) ? response : response.data;

export const ServicosPage: React.FC = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  useEffect(() => {
    const loadServicos = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await servicosService.list();
        setServicos(extractList(response));
      } catch (loadError) {
        console.error('Erro ao carregar servicos:', loadError);
        setServicos(fallbackServicos);
        setError('Nao foi possivel carregar servicos da API. Exibindo dados locais temporarios.');
      } finally {
        setLoading(false);
      }
    };

    void loadServicos();
  }, []);

  const filteredServicos = useMemo(
    () =>
      servicos.filter((servico) => {
        const query = searchTerm.toLowerCase();
        return servico.nome.toLowerCase().includes(query) || servico.cliente.toLowerCase().includes(query);
      }),
    [servicos, searchTerm]
  );

  const groupedServicos = useMemo(
    () => ({
      pendente: filteredServicos.filter((item) => item.status === 'pendente'),
      em_andamento: filteredServicos.filter((item) => item.status === 'em_andamento'),
      concluido: filteredServicos.filter((item) => item.status === 'concluido')
    }),
    [filteredServicos]
  );

  const updateServicoStatus = async (id: string, nextStatus: KanbanStatus) => {
    const previous = servicos;

    setServicos((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              status: nextStatus
            }
          : item
      )
    );

    try {
      await servicosService.update(id, { status: nextStatus });
    } catch (updateError) {
      console.error('Erro ao atualizar status do servico:', updateError);
      setServicos(previous);
      setError('Nao foi possivel atualizar o status do servico na API.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Servicos</h1>
        <p className="mt-1 text-gray-400">Kanban inicial com 3 status.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Buscar servicos por nome ou cliente..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={<MagnifyingGlass />}
          />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <Card key={column.id} className={`border ${column.className}`}>
            <CardContent className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{column.label}</h2>
                <span className="rounded-full bg-slate-900/70 px-2.5 py-0.5 text-xs text-slate-300">
                  {groupedServicos[column.id].length}
                </span>
              </div>

              <div
                className="space-y-3"
                onDragOver={(event: React.DragEvent<HTMLDivElement>) => event.preventDefault()}
                onDrop={(event: React.DragEvent<HTMLDivElement>) => {
                  event.preventDefault();
                  const id = event.dataTransfer.getData('text/service-id');
                  if (!id) {
                    return;
                  }

                  setDraggedId(null);
                  void updateServicoStatus(id, column.id);
                }}
              >
                {groupedServicos[column.id].map((servico) => (
                  <div
                    key={servico.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggedId(servico.id);
                      event.dataTransfer.setData('text/service-id', servico.id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    className={`cursor-grab rounded-xl border border-white/10 bg-slate-900/80 p-4 transition hover:border-cyan-300/40 hover:bg-slate-800/80 ${
                      draggedId === servico.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="mb-2 text-sm font-semibold text-slate-100">{servico.nome}</div>
                    <div className="text-sm text-slate-300">{servico.cliente}</div>
                    <div className="mt-1 text-xs text-slate-400">{servico.data}</div>
                    <div className="mt-1 text-xs text-slate-400">R$ {servico.valor.toFixed(2)}</div>

                    <div className="mt-3 flex justify-end">
                      <select
                        value={servico.status}
                        onChange={(event) => {
                          void updateServicoStatus(servico.id, event.target.value as KanbanStatus);
                        }}
                        className="rounded-lg border border-white/20 bg-slate-950/70 px-2 py-1 text-xs text-slate-200"
                      >
                        <option value="pendente">Pendente</option>
                        <option value="em_andamento">Em Andamento</option>
                        <option value="concluido">Concluido</option>
                      </select>
                    </div>
                  </div>
                ))}

                {groupedServicos[column.id].length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/15 p-4 text-center text-sm text-slate-400">
                    Nenhum servico nesta coluna.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => setError(null)}>
          Limpar aviso
        </Button>
      </div>
    </div>
  );
};
