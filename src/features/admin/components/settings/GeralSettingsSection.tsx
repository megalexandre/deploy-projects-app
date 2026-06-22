import React, { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import { Input } from '@/shared/components/Input';
import { ApiError, usersService } from '@/services';
import type { ConfiguracoesSistema, User } from '@/types';
import { Buildings, EnvelopeSimple, Phone } from '@phosphor-icons/react';
import { maskCnpj, maskPhoneBR } from '@/core/utils/masks';

interface GeralSettingsSectionProps {
  formData: ConfiguracoesSistema;
  currentUser: User | null;
  onInputChange: <K extends keyof ConfiguracoesSistema>(
    field: K,
    value: ConfiguracoesSistema[K],
  ) => void;
}

export const GeralSettingsSection: React.FC<GeralSettingsSectionProps> = ({
  formData,
  currentUser,
  onInputChange,
}) => {
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const resetPasswordForm = () => {
    setPassword('');
    setPasswordConfirmation('');
    setPasswordError(null);
  };

  const handleTogglePasswordForm = () => {
    setPasswordFormOpen((isOpen) => {
      if (isOpen) {
        resetPasswordForm();
        setPasswordSuccess(null);
      }

      return !isOpen;
    });
  };

  const handleSubmitPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setPasswordError('Não foi possível identificar o usuário autenticado.');
      return;
    }

    if (password.length < 8 || passwordConfirmation.length < 8) {
      setPasswordError('Preencha a senha com pelo menos 8 caracteres.');
      return;
    }

    if (password !== passwordConfirmation) {
      setPasswordError('A confirmação de senha precisa ser igual à senha.');
      return;
    }

    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await usersService.resetPassword(currentUser.id, {
        password,
        passwordConfirmation,
      });

      resetPasswordForm();
      setPasswordFormOpen(false);
      setPasswordSuccess('Senha alterada com sucesso.');
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setPasswordError(
        error instanceof ApiError ? error.message : 'Não foi possível alterar a senha.',
      );
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <h3 className="mb-4 text-lg font-medium text-gray-100">Informações da Empresa</h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          label="Nome da Empresa"
          value={formData.nomeEmpresa}
          onChange={(event) => onInputChange('nomeEmpresa', event.target.value)}
          icon={<Buildings />}
        />

        <Input
          label="CNPJ"
          value={formData.cnpj}
          onChange={(event) => onInputChange('cnpj', maskCnpj(event.target.value))}
        />

        <Input
          label="Telefone"
          value={formData.telefone}
          onChange={(event) => onInputChange('telefone', maskPhoneBR(event.target.value))}
          icon={<Phone />}
        />

        <Input
          label="E-mail"
          value={formData.email}
          onChange={(event) => onInputChange('email', event.target.value)}
          icon={<EnvelopeSimple />}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-300">Endereço</label>
        <textarea
          value={formData.endereco}
          onChange={(event) => onInputChange('endereco', event.target.value)}
          className="w-full resize-none rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-gray-100 focus:border-blue-500 focus:outline-none"
          rows={3}
        />
      </div>

      <div className="border-t border-gray-700 pt-6">
        <h3 className="mb-2 text-lg font-medium text-gray-100">Senha</h3>
        <p className="mb-4 text-sm text-gray-400">
          Altere sua senha regularmente para manter a segurança.
        </p>

        {passwordSuccess && (
          <p className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {passwordSuccess}
          </p>
        )}

        {!passwordFormOpen ? (
          <Button variant="outline" onClick={handleTogglePasswordForm}>
            Alterar Senha
          </Button>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmitPassword}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Nova senha"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                minLength={8}
                required
              />
            </div>

            {passwordError && <ErrorAlert message={passwordError} />}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={savingPassword}>
                Salvar senha
              </Button>
              <Button type="button" variant="outline" onClick={handleTogglePasswordForm}>
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
