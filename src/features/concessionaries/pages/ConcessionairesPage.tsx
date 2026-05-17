import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { MagnifyingGlass, PencilSimple } from '@phosphor-icons/react';
import React from 'react';
import { ConcessionaireFormCard } from '../components/ConcessionaireFormCard';
import { useConcessionaires } from '../hooks/useConcessionaires';

export const ConcessionairesPage: React.FC = () => {
  const {
    form,
    setField,
    filteredItems,
    searchTerm,
    setSearchTerm,
    error,
    loading,
    saving,
    editingId,
    handleSubmit,
    handleEdit,
    handleCancelEdit,
  } = useConcessionaires();

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
        <h1 className="text-3xl font-bold text-gray-100">Concessionárias</h1>
        <p className="mt-1 text-gray-400">
          Cadastro integrado ao backend para uso em projetos e serviços.
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
            placeholder="Buscar por nome, sigla ou código..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={<MagnifyingGlass />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Concessionárias Cadastradas ({filteredItems.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Sigla</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Região</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="text-sm text-slate-200">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400">{item.acronym || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{item.code || '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{item.region || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.active
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {item.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <PencilSimple className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={6}>
                      Nenhuma concessionária encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConcessionaireFormCard
        form={form}
        setField={setField}
        editingId={editingId}
        saving={saving}
        onSubmit={handleSubmit}
        onCancel={handleCancelEdit}
      />
    </div>
  );
};
