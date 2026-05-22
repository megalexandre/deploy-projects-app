import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { Input } from '@/shared/components/Input';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { LogoAvatar } from '@/shared/components/LogoAvatar';
import { StatusBadge } from '@/shared/components/StatusBadge';
import { MagnifyingGlass, PencilSimple, PlusCircle } from '@phosphor-icons/react';
import React, { useMemo, useState } from 'react';
import { ConcessionaireFormModal } from './ConcessionaireFormModal';
import { useConcessionaires } from '../hooks/useConcessionaires';

interface ConcessionairesSectionProps {
  compactHeader?: boolean;
}

export const ConcessionairesSection: React.FC<ConcessionairesSectionProps> = ({
  compactHeader = false,
}) => {
  const ITEMS_PER_PAGE = 10;
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
    isConcessionaireModalOpen,
    handleSubmit,
    handleEdit,
    handleOpenCreateModal,
    handleCancelEdit,
  } = useConcessionaires();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, safeCurrentPage]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      {!compactHeader && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Concessionarias</h1>
            <p className="mt-1 text-gray-400">Cadastro para uso em projetos e servicos.</p>
          </div>
          <Button type="button" onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova concessionaria
          </Button>
        </div>
      )}

      {compactHeader && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova concessionaria
          </Button>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Buscar por nome, sigla ou codigo..."
            value={searchTerm}
            onChange={(event) => {
              setCurrentPage(1);
              setSearchTerm(event.target.value);
            }}
            icon={<MagnifyingGlass />}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Concessionarias Cadastradas ({filteredItems.length})</CardTitle>
            <span className="text-xs text-slate-400">
              Pagina {safeCurrentPage} de {totalPages}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Sigla</th>
                  <th className="px-4 py-3">Codigo</th>
                  <th className="px-4 py-3">Regiao</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Logo</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="text-sm text-slate-200">
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3 text-slate-400">{item.acronym || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{item.code || '-'}</td>
                    <td className="px-4 py-3 text-slate-400">{item.region || '-'}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        variant={item.active ? 'active' : 'inactive'}
                        label={item.active ? 'Ativa' : 'Inativa'}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <LogoAvatar src={item.logo} name={item.acronym || item.name} />
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
                {paginatedItems.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={7}>
                      Nenhuma concessionaria encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredItems.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between border-t border-white/10 px-4 py-4">
              <p className="text-sm text-slate-400">
                Exibindo {(safeCurrentPage - 1) * ITEMS_PER_PAGE + 1}-
                {Math.min(safeCurrentPage * ITEMS_PER_PAGE, filteredItems.length)} de{' '}
                {filteredItems.length} concessionarias
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={safeCurrentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={safeCurrentPage === totalPages}
                >
                  Proxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isConcessionaireModalOpen && (
        <ConcessionaireFormModal
          form={form}
          setField={setField}
          editingId={editingId}
          saving={saving}
          onSubmit={handleSubmit}
          onClose={handleCancelEdit}
        />
      )}
    </div>
  );
};
