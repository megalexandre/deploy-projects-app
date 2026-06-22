import { useEffect, useMemo, useState } from 'react';
import { ApiError, usersService, type CreateUserData, type User as SystemUser } from '@/services';

export type UserForm = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: string;
};

export const createEmptyUserForm = (): UserForm => ({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  role: 'user',
});

export const formatRoleLabel = (role?: string) => {
  const normalized = (role ?? 'user').trim().toLowerCase();
  if (normalized === 'main') {
    return 'Main';
  }

  return 'Usuário';
};

export const formatUserDate = (value?: string) => {
  if (!value) {
    return '-';
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('pt-BR');
};

export const useUsers = () => {
  const [usuarios, setUsuarios] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('todos');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserForm>(createEmptyUserForm());
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [userToReset, setUserToReset] = useState<SystemUser | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        setUsuarios(await usersService.getAll());
      } catch (loadError) {
        console.error('Erro ao carregar usuários:', loadError);
        setError('Não foi possível carregar os usuários do sistema.');
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
    () => [
      'todos',
      ...Array.from(new Set(usuarios.map((usuario) => (usuario.role ?? 'user').toLowerCase()))),
    ],
    [usuarios],
  );

  const adminUsers = usuarios.filter((usuario) => {
    const role = (usuario.role ?? 'user').toLowerCase();
    return role === 'main';
  }).length;

  const regularUsers = usuarios.length - adminUsers;

  const resetForm = () => {
    setForm(createEmptyUserForm());
    setEditingUserId(null);
    setShowPassword(false);
    setShowPasswordConfirmation(false);
    setError(null);
  };

  const handleOpenCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const handleDeleteUser = (user: SystemUser) => {
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    const user = userToDelete;
    setUserToDelete(null);

    try {
      await usersService.delete(user.id);
      setUsuarios((current) => current.filter((u) => u.id !== user.id));
    } catch (deleteError) {
      console.error('Erro ao deletar usuário:', deleteError);
      if (deleteError instanceof ApiError) {
        setError(deleteError.message);
      } else {
        setError('Não foi possível deletar o usuário.');
      }
    }
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
  };

  const handleOpenResetPassword = (user: SystemUser) => {
    setUserToReset(user);
  };

  const handleCloseResetPassword = () => {
    setUserToReset(null);
  };

  const handleResetPassword = async (password: string) => {
    if (!userToReset) return;

    const updatedUser = await usersService.resetPassword(userToReset.id, password);
    setUsuarios((current) =>
      current.map((user) => (user.id === userToReset.id ? { ...user, ...updatedUser } : user)),
    );
  };

  const handleSaveUser = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.name.trim().length < 3 || form.email.trim().length < 5) {
      setError('Preencha nome e e-mail corretamente.');
      return;
    }

    if (!editingUserId && (form.password.length < 8 || form.passwordConfirmation.length < 8)) {
      setError('Preencha a senha com pelo menos 8 caracteres.');
      return;
    }

    if (!editingUserId && form.password !== form.passwordConfirmation) {
      setError('A confirmação de senha precisa ser igual à senha.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editingUserId) {
        const updatedUser = await usersService.update(editingUserId, {
          name: form.name,
          email: form.email,
          role: form.role,
        });

        setUsuarios((current) =>
          current
            .map((user) => (user.id === editingUserId ? { ...user, ...updatedUser } : user))
            .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR')),
        );
      } else {
        const createdUser = await usersService.create({
          name: form.name,
          email: form.email,
          password: form.password,
          passwordConfirmation: form.passwordConfirmation,
          role: form.role,
        } satisfies CreateUserData);

        setUsuarios((current) =>
          [...current, createdUser].sort((left, right) =>
            left.name.localeCompare(right.name, 'pt-BR'),
          ),
        );
      }

      setFormOpen(false);
      resetForm();
    } catch (saveError) {
      console.error('Erro ao salvar usuário:', saveError);
      if (saveError instanceof ApiError) {
        setError(saveError.message);
      } else {
        setError(
          editingUserId
            ? 'Não foi possível atualizar o usuário.'
            : 'Não foi possível criar o usuário.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return {
    usuarios,
    filteredUsuarios,
    roleOptions,
    adminUsers,
    regularUsers,
    loading,
    saving,
    error,
    searchTerm,
    selectedRole,
    formOpen,
    form,
    editingUserId,
    showPassword,
    showPasswordConfirmation,
    setSearchTerm,
    setSelectedRole,
    setForm,
    setShowPassword,
    setShowPasswordConfirmation,
    userToDelete,
    userToReset,
    handleOpenCreateForm,
    handleCloseForm,
    handleDeleteUser,
    handleConfirmDelete,
    handleCancelDelete,
    handleOpenResetPassword,
    handleCloseResetPassword,
    handleResetPassword,
    handleSaveUser,
  };
};
