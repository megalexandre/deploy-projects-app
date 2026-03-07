/** Pagina 'ClientesPage': lista clientes cadastrados e permite novo cadastro com endereco. */
import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, PlusCircle } from '@phosphor-icons/react';
import { Button } from '../components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import { Input } from '../components/Input';
import { customersService, type Customer } from '../services';
import { maskCep, maskCnpj, maskCpf, maskPhoneBR, onlyDigits } from '../utils/masks';

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

export const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('cpf');
  const [form, setForm] = useState<ClienteForm>(createEmptyForm());

  const loadClientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customersService.getAll();
      setClientes(response);
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
      await customersService.create({
        nome: form.nome.trim(),
        cpfCnpj: onlyDigits(form.cpfCnpj),
        telefone: onlyDigits(form.telefone),
        email: form.email.trim(),
        endereco: {
          cep: onlyDigits(form.endereco.cep),
          logradouro: form.endereco.logradouro.trim(),
          numero: form.endereco.numero.trim(),
          complemento: form.endereco.complemento.trim(),
          bairro: form.endereco.bairro.trim(),
          cidade: form.endereco.cidade.trim(),
          estado: form.endereco.estado.trim().toUpperCase()
        }
      });

      setForm(createEmptyForm());
      setTipoDocumento('cpf');
      await loadClientes();
    } catch (saveError) {
      console.error('Erro ao cadastrar cliente:', saveError);
      setError('Nao foi possivel cadastrar o cliente.');
    } finally {
      setSaving(false);
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
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className="text-sm text-slate-200">
                    <td className="px-4 py-3">{cliente.nome}</td>
                    <td className="px-4 py-3">{cliente.cpfCnpj}</td>
                    <td className="px-4 py-3">{cliente.telefone}</td>
                    <td className="px-4 py-3">{cliente.email}</td>
                    <td className="px-4 py-3">
                      {cliente.endereco?.cidade
                        ? `${cliente.endereco.cidade}/${cliente.endereco.estado}`
                        : cliente.enderecoCompleto || '-'}
                    </td>
                  </tr>
                ))}
                {clientesFiltrados.length === 0 && (
                  <tr>
                    <td className="px-4 py-6 text-center text-sm text-slate-400" colSpan={5}>
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
          <CardTitle>Novo Cliente</CardTitle>
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
                Cadastrar Cliente
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
