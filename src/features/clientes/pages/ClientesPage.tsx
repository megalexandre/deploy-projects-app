/** Pagina 'ClientesPage': lista clientes cadastrados e permite novo cadastro com endereco. */
import React from 'react';
import { MagnifyingGlass, PlusCircle } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { CustomerDocumentsCard } from '../components/CustomerDocumentsCard';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CustomerListCard } from '../components/CustomerListCard';
import { useClientes } from '../hooks/useClientes';

export const ClientesPage: React.FC = () => {
  const {
    clientesFiltrados,
    clienteComDocumentosAbertos,
    loading,
    saving,
    error,
    searchTerm,
    tipoDocumento,
    form,
    editingCustomerId,
    isCustomerModalOpen,
    selectedDocumentsCustomerId,
    uploadingDocuments,
    setSearchTerm,
    setTipoDocumento,
    setForm,
    handleSubmit,
    handleEditCustomer,
    handleOpenCreateModal,
    handleCancelEdit,
    handleOpenDocuments,
    handleCloseDocuments,
    handleDownload,
    handleUploadDocuments,
    handleEnderecoCepBlur,
  } = useClientes();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Clientes</h1>
            <p className="mt-1 text-gray-400">
              Lista de clientes cadastrados e novo cadastro com endereco.
            </p>
          </div>
          <Button type="button" onClick={handleOpenCreateModal}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Cadastrar cliente
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <Card>
        <CardContent className="p-6">
          <Input
            placeholder="Buscar por nome, documento, telefone, email ou cidade..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            icon={<MagnifyingGlass />}
          />
        </CardContent>
      </Card>

      <CustomerListCard
        customers={clientesFiltrados}
        onEdit={handleEditCustomer}
        onOpenDocuments={handleOpenDocuments}
      />

      {isCustomerModalOpen && (
        <CustomerFormModal
          form={form}
          tipoDocumento={tipoDocumento}
          editingCustomerId={editingCustomerId}
          saving={saving}
          onTipoDocumentoChange={setTipoDocumento}
          onFormChange={(updater) => setForm((prev) => updater(prev))}
          onSubmit={handleSubmit}
          onClose={handleCancelEdit}
          onCepBlur={() => void handleEnderecoCepBlur()}
        />
      )}

      {selectedDocumentsCustomerId && clienteComDocumentosAbertos && (
        <CustomerDocumentsCard
          customer={clienteComDocumentosAbertos}
          uploadingDocuments={uploadingDocuments}
          onUploadDocuments={(files) => void handleUploadDocuments(files)}
          onDownload={(fileId) => void handleDownload(fileId)}
          onClose={handleCloseDocuments}
        />
      )}
    </div>
  );
};
