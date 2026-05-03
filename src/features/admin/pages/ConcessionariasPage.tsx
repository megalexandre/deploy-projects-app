/** Pagina 'ConcessionariasPage': gerencia cadastro de concessionarias integrado ao backend. */
import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, PencilSimple, PlusCircle } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { concessionariasService, type Concessionaria } from '../services/concessionariasService';

interface ConcessionariaForm {
  nome: string;
}

const createEmptyForm = (): ConcessionariaForm => ({
  nome: ''
});

const createFormFromConcessionaria = (item: Concessionaria): ConcessionariaForm => ({
  nome: item.nome
});

const isFormValid = (form: ConcessionariaForm) => form.nome.trim().length >= 2;

export const ConcessionariasPage: React.FC = () => {
  const [items, setItems] = useState<Concessionaria[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ConcessionariaForm>(createEmptyForm());

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await concessionariasService.getAll());
    } catch (loadError) {
      console.error('Erro ao carregar concessionarias:', loadError);
      setError('Nao foi possivel carregar as concessionarias.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      return item.nome.toLowerCase().includes(query);
    });
  }, [items, searchTerm]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isFormValid(form)) {
      setError('Informe pelo menos o nome da concessionaria.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        nome: form.nome.trim()
      };

      if (editingId) {
        await concessionariasService.update(editingId, payload);
      } else {
        await concessionariasService.create(payload);
      }

      setEditingId(null);
      setForm(createEmptyForm());
      await loadData();
    } catch (saveError) {
      console.error('Erro ao salvar concessionaria:', saveError);
      setError('Nao foi possivel salvar a concessionaria.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: Concessionaria) => {
    setEditingId(item.id);
    setForm(createFormFromConcessionaria(item));
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setError(null);
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
        <h1 className="text-3xl font-bold text-gray-100">Concessionarias</h1>
        <p className="mt-1 text-gray-400">
          Cadastro integrado ao backend para uso em projetos e servicos.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={<MagnifyingGlass />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Concessionarias Cadastradas ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="text-sm text-slate-200">
                    <td className="px-4 py-3">{item.nome}</td>
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleEdit(item)}>
                        <PencilSimple className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={2}>
                      Nenhuma concessionaria encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>{editingId ? 'Editar Concessionaria' : 'Nova Concessionaria'}</CardTitle>
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancelar edicao
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Nome</label>
                <input
                  value={form.nome}
                  onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {editingId ? 'Salvar Alteracoes' : 'Cadastrar Concessionaria'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
