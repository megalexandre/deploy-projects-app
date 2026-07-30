import React from 'react';
import { formatCurrencyBRL } from '@/core/utils/masks';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { ProjetosPageHeader } from '../components/ProjectPageHeader';
import { ProjetosFilter } from '../components/ProjectFilter';
import { KanbanColumn } from '../components/KanbanColumn';
import { StatusChangeDialog } from '../components/StatusChangeDialog';
import { useProjetosKanban } from '../hooks/useProjetosKanban';

export const ProjetosPage: React.FC = () => {
  const {
    loading,
    error,
    searchTerm,
    statusFilter,
    userFilter,
    userOptions,
    filteredProjetos,
    groupedProjetos,
    visibleColumns,
    stats,
    draggedId,
    pendingStatusChange,
    statusComment,
    updatingStatus,
    containerRef,
    isDragging,
    dragBindings,
    setSearchTerm,
    setStatusFilter,
    setUserFilter,
    setStatusComment,
    setDraggedId,
    openStatusDialog,
    confirmStatusChange,
    cancelStatusChange,
    handleDrop,
    handleDragStart,
    handleProjectUpdated,
  } = useProjetosKanban();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      <ProjetosPageHeader />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Projetos</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Em aberto</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{stats.abertas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Aprovados</div>
            <div className="mt-2 text-3xl font-semibold text-slate-100">{stats.aprovados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
              Receita prevista
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {formatCurrencyBRL(stats.valor)}
            </div>
          </CardContent>
        </Card>
      </div>

      <ProjetosFilter
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        userFilter={userFilter}
        userOptions={userOptions}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
        onUserChange={setUserFilter}
      />

      {error && <ErrorAlert message={error} />}

      <Card padding="none">
        <CardHeader className="mb-0 px-6 pb-4 pt-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Pipeline de Projetos</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                Arraste lateralmente para navegar pelas colunas do kanban.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs text-slate-300">
              {filteredProjetos.length} projeto(s)
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <div
            ref={containerRef}
            className={[
              'hide-scrollbar overflow-x-auto pb-2',
              'touch-pan-y select-none',
              isDragging ? 'cursor-grabbing' : 'cursor-grab',
            ].join(' ')}
            {...dragBindings}
          >
            <div className="flex min-w-max snap-x snap-mandatory items-start gap-4">
              {visibleColumns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  projetos={groupedProjetos[column.id]}
                  draggedId={draggedId}
                  onDragStart={handleDragStart}
                  onDragEnd={() => setDraggedId(null)}
                  onDrop={handleDrop}
                  onStatusChange={openStatusDialog}
                  onProjectUpdated={handleProjectUpdated}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {pendingStatusChange && (
        <StatusChangeDialog
          pendingStatusChange={pendingStatusChange}
          statusComment={statusComment}
          updatingStatus={updatingStatus}
          onCommentChange={setStatusComment}
          onConfirm={() => void confirmStatusChange()}
          onCancel={cancelStatusChange}
        />
      )}
    </div>
  );
};
