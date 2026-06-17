import React from 'react';
import { Plus } from '@phosphor-icons/react';
import { Button } from '@/shared/components/Button';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { UserFiltersCard } from '../components/UserFiltersCard';
import { UserFormModal } from '../components/UserFormModal';
import { UserListCard } from '../components/UserListCard';
import { UserStatsGrid } from '../components/UserStatsGrid';
import { useUsers } from '../hooks/useUsers';

export const UsuariosPage: React.FC = () => {
  const {
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
  } = useUsers();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Usuários</h1>
          <p className="mt-1 text-gray-400">Gerenciamento de usuários via autenticação da API.</p>
        </div>
        <Button className="mt-4 sm:mt-0" onClick={handleOpenCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      <UserStatsGrid
        totalUsers={usuarios.length}
        mainUsers={adminUsers}
        regularUsers={regularUsers}
        profileCount={roleOptions.filter((item) => item !== 'todos').length}
      />

      <UserFiltersCard
        searchTerm={searchTerm}
        selectedRole={selectedRole}
        roleOptions={roleOptions}
        onSearchChange={setSearchTerm}
        onRoleChange={setSelectedRole}
      />

      {error && <ErrorAlert message={error} />}

      <UserListCard
        users={filteredUsuarios}
        onDelete={handleDeleteUser}
        onResetPassword={handleOpenResetPassword}
      />

      {userToDelete && (
        <ConfirmDeleteModal
          user={userToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}

      {userToReset && (
        <ResetPasswordDialog
          user={userToReset}
          onConfirm={handleResetPassword}
          onClose={handleCloseResetPassword}
        />
      )}

      {formOpen && (
        <UserFormModal
          form={form}
          editingUserId={editingUserId}
          saving={saving}
          showPassword={showPassword}
          showPasswordConfirmation={showPasswordConfirmation}
          onFormChange={(updater) => setForm((current) => updater(current))}
          onTogglePassword={() => setShowPassword((current) => !current)}
          onTogglePasswordConfirmation={() => setShowPasswordConfirmation((current) => !current)}
          onSubmit={handleSaveUser}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};
