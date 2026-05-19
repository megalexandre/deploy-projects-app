import { useEffect, useMemo, useState } from 'react';
import {
  ApiError,
  addressService,
  customersService,
  filesService,
  viaCepService,
  type Customer,
} from '@/services';
import { maskCep, maskCpfOrCnpj, maskPhoneBR, onlyDigits } from '@/core/utils/masks';

export type TipoDocumento = 'cpf' | 'cnpj';

export interface ClienteForm {
  nome: string;
  cpfCnpj: string;
  telefone: string;
  email: string;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
}

export const createEmptyCustomerForm = (): ClienteForm => ({
  nome: '',
  cpfCnpj: '',
  telefone: '',
  email: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
  },
});

export const getTipoDocumento = (cpfCnpj: string): TipoDocumento =>
  onlyDigits(cpfCnpj).length > 11 ? 'cnpj' : 'cpf';

export const formatDocumento = (cpfCnpj: string): string => maskCpfOrCnpj(cpfCnpj);

export const formatTelefone = (telefone: string): string => maskPhoneBR(onlyDigits(telefone));

const extractApiErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const response = payload as { errors?: Record<string, string | null>; message?: string };
  const fieldErrors = response.errors
    ? Object.entries(response.errors).filter(([, value]) => Boolean(value))
    : [];

  if (fieldErrors.length > 0) {
    return fieldErrors.map(([field, message]) => `${field}: ${message}`).join(' | ');
  }

  return response.message || fallback;
};

const createFormFromCustomer = (customer: Customer): ClienteForm => ({
  nome: customer.nome,
  cpfCnpj: formatDocumento(customer.cpfCnpj),
  telefone: formatTelefone(customer.telefone),
  email: customer.email,
  endereco: {
    cep: maskCep(customer.endereco?.cep ?? ''),
    logradouro: customer.endereco?.logradouro ?? '',
    numero: customer.endereco?.numero ?? '',
    complemento: customer.endereco?.complemento ?? '',
    bairro: customer.endereco?.bairro ?? '',
    cidade: customer.endereco?.cidade ?? '',
    estado: customer.endereco?.estado ?? '',
  },
});

export const useClientes = () => {
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [form, setForm] = useState<ClienteForm>(createEmptyCustomerForm());
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedDocumentsCustomerId, setSelectedDocumentsCustomerId] = useState<string | null>(
    null,
  );
  const [uploadingDocuments, setUploadingDocuments] = useState(false);

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersService.getAll();
      const detailedCustomers = await Promise.all(
        response.map(async (customer) => {
          try {
            return await customersService.getById(customer.id);
          } catch {
            return customer;
          }
        }),
      );
      setClientes(detailedCustomers);
    } catch (loadError) {
      console.error('Erro ao carregar clientes:', loadError);
      setError('Nao foi possivel carregar os clientes cadastrados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return clientes;

    const queryDigits = onlyDigits(query);
    return clientes.filter((cliente) => {
      const textMatch =
        cliente.nome.toLowerCase().includes(query) ||
        cliente.email.toLowerCase().includes(query) ||
        (cliente.enderecoCompleto ?? '').toLowerCase().includes(query) ||
        cliente.endereco?.cidade?.toLowerCase().includes(query) ||
        cliente.endereco?.estado?.toLowerCase().includes(query);
      const digitsMatch =
        onlyDigits(cliente.cpfCnpj).includes(queryDigits) ||
        onlyDigits(cliente.telefone).includes(queryDigits);
      return textMatch || Boolean(queryDigits && digitsMatch);
    });
  }, [clientes, searchTerm]);

  const clienteComDocumentosAbertos = useMemo(
    () => clientes.find((cliente) => cliente.id === selectedDocumentsCustomerId) ?? null,
    [clientes, selectedDocumentsCustomerId],
  );

  const isFormValid = () => {
    const documentoLimpo = onlyDigits(form.cpfCnpj);
    const tamanhoDocumentoValido = tipoDocumento === 'cpf' ? 11 : 14;
    const telefoneValido = onlyDigits(form.telefone).length >= 10;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());

    const endereco = form.endereco;
    const enderecoValido =
      onlyDigits(endereco.cep).length === 8 &&
      endereco.logradouro.trim().length >= 3 &&
      endereco.numero.trim().length >= 1 &&
      endereco.bairro.trim().length >= 2 &&
      endereco.cidade.trim().length >= 2 &&
      endereco.estado.trim().length === 2;
    return (
      form.nome.trim().length >= 2 &&
      documentoLimpo.length === tamanhoDocumentoValido &&
      telefoneValido &&
      emailValido &&
      enderecoValido
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isFormValid()) {
      setError('Preencha todos os campos obrigatorios do cliente e endereco.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const addressPayload = {
        cep: onlyDigits(form.endereco.cep),
        place: form.endereco.logradouro.trim(),
        number: form.endereco.numero.trim(),
        address: form.endereco.logradouro.trim(),
        complement: form.endereco.complemento.trim(),
        neighborhood: form.endereco.bairro.trim(),
        city: form.endereco.cidade.trim(),
        state: form.endereco.estado.trim().toLowerCase(),
        link: '',
      };

      const address = editingAddressId
        ? await addressService.update({ id: editingAddressId, ...addressPayload })
        : await addressService.create(addressPayload);

      const payload = {
        nome: form.nome.trim(),
        addressId: address.id,
        cpfCnpj: onlyDigits(form.cpfCnpj),
        telefone: onlyDigits(form.telefone),
        email: form.email.trim(),
      };

      if (editingCustomerId) {
        await customersService.update(editingCustomerId, payload);
      } else {
        await customersService.create(payload);
      }

      setForm(createEmptyCustomerForm());
      setTipoDocumento('cpf');
      setEditingCustomerId(null);
      setEditingAddressId(null);
      setIsCustomerModalOpen(false);
      await loadClientes();
    } catch (saveError) {
      console.error('Erro ao salvar cliente:', saveError);
      if (saveError instanceof ApiError) {
        console.error('Detalhes da validacao:', saveError.payload);
        setError(
          extractApiErrorMessage(
            saveError.payload,
            editingCustomerId
              ? 'Nao foi possivel atualizar o cliente.'
              : 'Nao foi possivel cadastrar o cliente.',
          ),
        );
      } else {
        setError(
          editingCustomerId
            ? 'Nao foi possivel atualizar o cliente.'
            : 'Nao foi possivel cadastrar o cliente.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditCustomer = async (customer: Customer) => {
    setError(null);

    try {
      const detailedCustomer = await customersService.getById(customer.id);
      setEditingCustomerId(detailedCustomer.id);
      setEditingAddressId(detailedCustomer.addressId ?? null);
      setTipoDocumento(getTipoDocumento(detailedCustomer.cpfCnpj));
      setForm(createFormFromCustomer(detailedCustomer));
      setIsCustomerModalOpen(true);
    } catch (loadError) {
      console.error('Erro ao carregar cliente para edicao:', loadError);
      setError('Nao foi possivel carregar os dados completos do cliente.');
    }
  };

  const handleOpenCreateModal = () => {
    setError(null);
    setEditingCustomerId(null);
    setEditingAddressId(null);
    setTipoDocumento('cpf');
    setForm(createEmptyCustomerForm());
    setIsCustomerModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingCustomerId(null);
    setEditingAddressId(null);
    setTipoDocumento('cpf');
    setForm(createEmptyCustomerForm());
    setError(null);
    setIsCustomerModalOpen(false);
  };

  const handleOpenDocuments = async (customer: Customer) => {
    setError(null);

    try {
      const detailedCustomer = await customersService.getById(customer.id);
      setSelectedDocumentsCustomerId(detailedCustomer.id);
      setClientes((current) =>
        current.map((item) => (item.id === detailedCustomer.id ? detailedCustomer : item)),
      );
    } catch (loadError) {
      console.error('Erro ao carregar documentos do cliente:', loadError);
      setError('Nao foi possivel carregar os documentos do cliente.');
    }
  };

  const handleCloseDocuments = () => {
    setSelectedDocumentsCustomerId(null);
  };

  const handleDownload = async (fileId?: string) => {
    if (!fileId) {
      return;
    }

    try {
      await filesService.downloadFile(fileId);
    } catch (downloadError) {
      console.error('Erro ao baixar documento do cliente:', downloadError);
      setError('Nao foi possivel baixar o documento do cliente.');
    }
  };

  const handleUploadDocuments = async (files: FileList | null) => {
    if (!selectedDocumentsCustomerId) {
      return;
    }

    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setUploadingDocuments(true);
    setError(null);

    try {
      const uploadedFiles = await filesService.uploadFiles(
        selectedDocumentsCustomerId,
        selectedFiles,
      );
      const documentosAtuais = clienteComDocumentosAbertos?.documentos ?? [];
      customersService.saveDocuments(selectedDocumentsCustomerId, [
        ...documentosAtuais,
        ...uploadedFiles.map((uploadedFile) => ({
          id: uploadedFile.id,
          fileId: uploadedFile.id,
          nome: uploadedFile.fileName,
          tipo: 'Documento',
          dataUpload: uploadedFile.createdAt ?? new Date().toISOString(),
          tamanho: uploadedFile.size,
          url: uploadedFile.urlS3,
        })),
      ]);
      await loadClientes();
    } catch (uploadError) {
      console.error('Erro ao enviar documentos do cliente:', uploadError);
      setError('Nao foi possivel enviar os documentos do cliente.');
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleEnderecoCepBlur = async () => {
    const cep = onlyDigits(form.endereco.cep);
    if (cep.length !== 8) {
      return;
    }

    try {
      const endereco = await viaCepService.lookup(cep);
      if (!endereco) {
        return;
      }

      setForm((prev) => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: maskCep(endereco.cep),
          logradouro: endereco.logradouro || prev.endereco.logradouro,
          complemento: prev.endereco.complemento || endereco.complemento,
          bairro: endereco.bairro || prev.endereco.bairro,
          cidade: endereco.cidade || prev.endereco.cidade,
          estado: endereco.estado || prev.endereco.estado,
        },
      }));
    } catch (lookupError) {
      console.error('Erro ao consultar CEP:', lookupError);
    }
  };

  return {
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
  };
};
