import { Input } from '@/shared/components/Input';
import type { ConfiguracoesSistema } from '@/types';
import { Buildings, EnvelopeSimple, Phone } from '@phosphor-icons/react';
import { maskCnpj, maskPhoneBR } from '@/core/utils/masks';

interface GeralSettingsSectionProps {
  formData: ConfiguracoesSistema;
  onInputChange: <K extends keyof ConfiguracoesSistema>(
    field: K,
    value: ConfiguracoesSistema[K],
  ) => void;
}

export const GeralSettingsSection: React.FC<GeralSettingsSectionProps> = ({
  formData,
  onInputChange,
}) => (
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
  </div>
);
