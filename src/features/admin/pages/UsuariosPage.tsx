import React, { useEffect, useMemo, useState } from 'react';
import { Users, Plus, MagnifyingGlass, Shield, User, EnvelopeSimple, X, Eye, EyeSlash } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/components/Card';
import { ApiError, usersService, type CreateUserData, type User as SystemUser } from '@/services';

type UserForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
};

const createEmptyForm = (): UserForm => ({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  role: 'user'
});

const formatRoleLabel = (role?: string) => {
  const normalized = (role ?? 'user').trim().toLowerCase();
  if (normalized === 'main') {
    return 'Main';
  }

  if (normalized === 'admin') {
    return 'Administrador';
  }

  return 'Usuario';
};

const formatDate = (value?: string) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR');
};

export const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(createEmptyForm());
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        setUsuarios(await usersService.getAll());
      } catch (loadError) {
        console.error('Erro ao carregar usuarios:', loadError);
        setError('Nao foi possivel carregar os usuarios do sistema.');
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, []);

  const filteredUsuarios = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const role = (usuario.role ?? 'user').toLowerCase();
      const matchesRole = selectedRole === 'todos' || role === selectedRole;

      if (!matchesRole) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        usuario.name.toLowerCase().includes(query) ||
        usuario.email.toLowerCase().includes(query) ||
        role.includes(query)
      );
    });
  }, [searchTerm, selectedRole, usuarios]);

  const roleOptions = useMemo(
    () => ['todos', ...Array.from(new Set(usuarios.map((usuario) => (usuario.role ?? 'user').toLowerCase())))],
    [usuarios]
  );

  const adminUsers = usuarios.filter((usuario) => {
    const role = (usuario.role ?? 'user').toLowerCase();
    return role === 'admin' || role === 'main';
  }).length;
  const regularUsers = usuarios.length - adminUsers;

  const resetForm = () => {
    setForm(createEmptyForm());
    setShowPassword(false);
    setShowPasswordConfirmation(false);
    setError(null);
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      form.name.trim().length < 3 ||
      form.email.trim().length < 5 ||
      form.password.length < 8 ||
      form.passwordConfirmation.length < 8
    ) {
      setError('Preencha nome, e-mail e senha com pelo menos 8 caracteres.');
      return;
    }

    if (form.password !== form.passwordConfirmation) {
      setError('A confirmacao de senha precisa ser igual a senha.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const createdUser = await usersService.create({
        name: form.name,
        email: form.email,
        password: form.password,
        passwordConfirmation: form.passwordConfirmation,
        role: form.role
      } satisfies CreateUserData);

      setUsuarios((current) =>
        [...current, createdUser].sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'))
      );
      setFormOpen(false);
      resetForm();
    } catch (saveError) {
      console.error('Erro ao criar usuario:', saveError);
      if (saveError instanceof ApiError) {
        setError(saveError.message);
      } else {
        setError('Nao foi possivel criar o usuario.');
      }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Usuarios</h1>
          <p className="mt-1 text-gray-400">Gerenciamento de usuarios via autenticacao da API.</p>
        </div>
        <Button
          className="mt-4 sm:mt-0"
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total</p>
                <p className="text-2xl font-bold text-blue-400">{usuarios.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Admins</p>
                <p className="text-2xl font-bold text-amber-300">{adminUsers}</p>
              </div>
              <Shield className="h-8 w-8 text-amber-300" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Usuarios</p>
                <p className="text-2xl font-bold text-green-400">{regularUsers}</p>
              </div>
              <User className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Perfis</p>
                <p className="text-2xl font-bold text-purple-400">{roleOptions.filter((item) => item !== 'todos').length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                icon={<MagnifyingGlass />}
              />
            </div>
            <select
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value)}
              className="rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role === 'todos' ? 'Todos os perfis' : formatRoleLabel(role)}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Perfil</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Criado em</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-300">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
                          {usuario.name
                            .split(' ')
                            .map((name) => name[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="text-gray-100 font-medium">{usuario.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-gray-100">
                        <EnvelopeSimple className="mr-2 h-4 w-4 text-gray-400" />
                        {usuario.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-100">{formatRoleLabel(usuario.role)}</td>
                    <td className="px-4 py-3 text-gray-100">{formatDate(usuario.createdAt)}</td>
                    <td className="px-4 py-3 text-gray-100">{formatDate(usuario.updatedAt)}</td>
                  </tr>
                ))}
                {filteredUsuarios.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                      Nenhum usuario encontrado para os filtros atuais.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Novo Usuario</h2>
                <p className="mt-1 text-sm text-slate-400">Cadastro enviado para `POST /auth/register`.</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-slate-800"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Nome</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Perfil</label>
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  className="w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                >
                  <option value="user">Usuario</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Senha</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      className="password-visibility-input w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 pr-12 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">Confirmar senha</label>
                  <div className="relative">
                    <input
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      value={form.passwordConfirmation}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, passwordConfirmation: event.target.value }))
                      }
                      className="password-visibility-input w-full rounded border border-gray-600 bg-gray-800 px-3 py-3 pr-12 text-gray-100 focus:outline-none focus:ring-2 focus:ring-opj-blue"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-white"
                      aria-label={showPasswordConfirmation ? 'Ocultar confirmacao de senha' : 'Mostrar confirmacao de senha'}
                    >
                      {showPasswordConfirmation ? <EyeSlash className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" loading={saving}>
                  Criar usuario
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
