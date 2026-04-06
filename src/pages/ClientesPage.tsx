/** Pagina 'ClientesPage': lista clientes cadastrados e permite novo cadastro com endereco. */
import React, { useEffect, useMemo, useState } from 'react';
import { DownloadSimple, FileText, MagnifyingGlass, PencilSimple, PlusCircle, UploadSimple } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Input } from '../components/Input';
import { ApiError, addressService, customersService, filesService, viaCepService, type Customer } from '../services';
import { maskCep, maskCnpj, maskCpf, maskCpfOrCnpj, maskPhoneBR, onlyDigits } from '../utils/masks';

type TipoDocumento = 'cpf' | 'cnpj';

interface ClienteForm {
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

const createEmptyForm = (): ClienteForm => ({
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
    estado: ''
  }
});

const getTipoDocumento = (cpfCnpj: string): TipoDocumento =>
  onlyDigits(cpfCnpj).length > 11 ? 'cnpj' : 'cpf';

const formatDocumento = (cpfCnpj: string): string => {
  return maskCpfOrCnpj(cpfCnpj);
};

const formatTelefone = (telefone: string): string => maskPhoneBR(onlyDigits(telefone));

const extractApiErrorMessage = (payload: unknown, fallback: string) => {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const response = payload as { errors?: Record<string, string | null>; message?: string };
  const fieldErrors = response.errors ? Object.entries(response.errors).filter(([, value]) => Boolean(value)) : [];

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
    estado: customer.endereco?.estado ?? ''
  }
});

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [form, setForm] = useState<ClienteForm>(createEmptyForm());
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
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
        })
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
        link: ''
      };

      const address = editingAddressId
        ? await addressService.update({ id: editingAddressId, ...addressPayload })
        : await addressService.create(addressPayload);

      const payload = {
        nome: form.nome.trim(),
        addressId: address.id,
        cpfCnpj: onlyDigits(form.cpfCnpj),
        telefone: onlyDigits(form.telefone),
        email: form.email.trim()
      };

      if (editingCustomerId) {
        await customersService.update(editingCustomerId, payload);
      } else {
        await customersService.create(payload);
      }

      setForm(createEmptyForm());
      setTipoDocumento('cpf');
      setEditingCustomerId(null);
      setEditingAddressId(null);
      await loadClientes();
    } catch (saveError) {
      console.error('Erro ao salvar cliente:', saveError);
      if (saveError instanceof ApiError) {
        console.error('Detalhes da validacao:', saveError.payload);
        setError(
          extractApiErrorMessage(
            saveError.payload,
            editingCustomerId ? 'Nao foi possivel atualizar o cliente.' : 'Nao foi possivel cadastrar o cliente.'
          )
        );
      } else {
        setError(editingCustomerId ? 'Nao foi possivel atualizar o cliente.' : 'Nao foi possivel cadastrar o cliente.');
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
    } catch (loadError) {
      console.error('Erro ao carregar cliente para edicao:', loadError);
      setError('Nao foi possivel carregar os dados completos do cliente.');
    }
  };

  const handleCancelEdit = () => {
    setEditingCustomerId(null);
    setEditingAddressId(null);
    setTipoDocumento('cpf');
    setForm(createEmptyForm());
    setError(null);
  };

  const clienteEmEdicao = useMemo(
    () => clientes.find((cliente) => cliente.id === editingCustomerId) ?? null,
    [clientes, editingCustomerId]
  );

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
    if (!editingCustomerId) {
      return;
    }

    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setUploadingDocuments(true);
    setError(null);

    try {
      const uploadedFiles = await filesService.uploadFiles(editingCustomerId, selectedFiles);
      const documentosAtuais = clienteEmEdicao?.documentos ?? [];
      customersService.saveDocuments(editingCustomerId, [
        ...documentosAtuais,
        ...uploadedFiles.map((uploadedFile) => ({
          id: uploadedFile.id,
          fileId: uploadedFile.id,
          nome: uploadedFile.fileName,
          tipo: 'Documento',
          dataUpload: uploadedFile.createdAt ?? new Date().toISOString(),
          tamanho: uploadedFile.size,
          url: uploadedFile.urlS3
        }))
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
          estado: endereco.estado || prev.endereco.estado
        }
      }));
    } catch (lookupError) {
      console.error('Erro ao consultar CEP:', lookupError);
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
        <h1 className="text-3xl font-bold text-gray-100">Clientes</h1>
        <p className="mt-1 text-gray-400">Lista de clientes cadastrados e novo cadastro com endereco.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

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

      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados ({clientesFiltrados.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">CPF/CNPJ</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Endereco</th>
                  <th className="px-4 py-3 text-right">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="text-sm text-slate-200">
                    <td className="px-4 py-3">{cliente.nome}</td>
                    <td className="px-4 py-3">{formatDocumento(cliente.cpfCnpj)}</td>
                    <td className="px-4 py-3">{formatTelefone(cliente.telefone)}</td>
                    <td className="px-4 py-3">{cliente.email}</td>
                    <td className="px-4 py-3">
                      {cliente.endereco?.cidade
                        ? `${cliente.endereco.cidade}/${cliente.endereco.estado}`
                        : cliente.enderecoCompleto || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEditCustomer(cliente)}>
                          <UploadSimple className="mr-2 h-4 w-4" />
                          Documentos
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => handleEditCustomer(cliente)}>
                        <PencilSimple className="mr-2 h-4 w-4" />
                        Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={6}>
                      Nenhum cliente encontrado.
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
            <CardTitle>{editingCustomerId ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
            {editingCustomerId && (
              <Button type="button" variant="outline" size="sm" onClick={handleCancelEdit}>
                Cancelar edicao
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">Nome Completo</label>
                <input
                  value={form.nome}
                  onChange={(event) => setForm((prev) => ({ ...prev, nome: event.target.value }))}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Documento</label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={tipoDocumento}
                    onChange={(event) => {
                      const novoTipo = event.target.value as TipoDocumento;
                      setTipoDocumento(novoTipo);
                      setForm((prev) => ({ ...prev, cpfCnpj: '' }));
                    }}
                    className="rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  >
                    <option value="cpf">CPF</option>
                    <option value="cnpj">CNPJ</option>
                  </select>
                  <input
                    value={form.cpfCnpj}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        cpfCnpj: tipoDocumento === 'cpf' ? maskCpf(event.target.value) : maskCnpj(event.target.value)
                      }))
                    }
                    className="col-span-2 rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Telefone</label>
                <input
                  value={form.telefone}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, telefone: maskPhoneBR(event.target.value) }))
                  }
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-slate-300">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="mb-3 text-lg font-semibold text-slate-100">Endereco</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">CEP</label>
                  <input
                    value={form.endereco.cep}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, cep: maskCep(event.target.value) }
                      }))
                    }
                    onBlur={() => void handleEnderecoCepBlur()}
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Numero</label>
                  <input
                    value={form.endereco.numero}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, numero: event.target.value }
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-300">Logradouro</label>
                  <input
                    value={form.endereco.logradouro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, logradouro: event.target.value }
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm text-slate-300">Complemento</label>
                  <input
                    value={form.endereco.complemento}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, complemento: event.target.value }
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Bairro</label>
                  <input
                    value={form.endereco.bairro}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, bairro: event.target.value }
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Cidade</label>
                  <input
                    value={form.endereco.cidade}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, cidade: event.target.value }
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-slate-300">UF</label>
                  <input
                    maxLength={2}
                    value={form.endereco.estado}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        endereco: { ...prev.endereco, estado: event.target.value.toUpperCase() }
                      }))
                    }
                    className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {editingCustomerId ? 'Salvar Alteracoes' : 'Cadastrar Cliente'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {editingCustomerId && clienteEmEdicao && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Documentos do Cliente</CardTitle>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-white/15 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan-300/50">
                <UploadSimple className="mr-2 h-4 w-4" />
                {uploadingDocuments ? 'Enviando...' : 'Adicionar documentos'}
                <input
                  type="file"
                  className="hidden"
                  multiple
                  disabled={uploadingDocuments}
                  onChange={(event) => {
                    void handleUploadDocuments(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {clienteEmEdicao.documentos.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhum documento cadastrado para este cliente.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-slate-950/50">
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Data</th>
                      <th className="px-4 py-3 text-right">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {clienteEmEdicao.documentos.map((documento) => (
                      <tr key={documento.id} className="text-sm text-slate-200">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />
                            {documento.nome}
                          </div>
                        </td>
                        <td className="px-4 py-3">{documento.tipo}</td>
                        <td className="px-4 py-3">{new Date(documento.dataUpload).toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" variant="outline" size="sm" onClick={() => void handleDownload(documento.fileId)} disabled={!documento.fileId}>
                            <DownloadSimple className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
